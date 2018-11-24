Penggunaan Exceptional di Ruby / Rails. 

Kode program akan lebih banyak kita lihat daripada kita tulis, maka daripada itu menulis kode yang mudah dimengerti dan memiliki struktur yang baik akan dapat meningkatkan kecepatan penambahan fitur dan dapat mengurangi potensi munculnya bug. 

Pada tulisan ini saya mencoba mengenalkan penggunakan `exceptional` atau eksepsi pada pembuatan API di ruby on rails. Dimana penggunaan eksepsi ini dapat meningkatkan nilai `readable` yang mungkin sangat tinggi. 

Pada sebelumnya, mari kita lihat cara tradisional bagaimana pada pembuatan enpoint tertentu pada API. 

(Catatan: Sebenarnya cara ini bisa dilakukan bukan hanya pada program jenis API, namun untuk kesederhanaan penulisan, saya akan mencontohkannya dengan contoh pembuatan API) 

```ruby
class UsersController < ApplicationController 
  def create 
    @var_a = Service.new(opts).peform 
    
    if @var_a.success? 
      // handling success response 
    else 
      render_error(@var_a.errors)
    end 
  end
end 
```

Kode diatas mungkin cukup dimengerti, untuk mengimplementasikannya kita dapat membuat kode seperti ini pada kelas service. 

```ruby
class Service
  attr_reader :success, :errors

  def initialize(opts)
    # store opts
    @success = false 
    @errors = []
  end

  def perform 
    # do something 
    @success = true # if success 
    @errors << "Something error" ## if have some trouble. 
  end
end 
```

Kode diatas juga masih cukup mudah mengerti. Namun bagaimana jika permintaan fitur menambah? penambahan fitur pada sebuah software akan selalu ada dan itu adalah hal yang baik, karena itu menandakan bahwa software itu terus berkembang. 

Maka ketika fitur bertambah artinya kode juga pasti bertambah, dengan mengimplemtasikan konsep SOLID, maka kita membuat kelas service baru, dan mungkin `controller` kita akan jadi seperti ini: 

```ruby
class UsersController < ApplicationController 
  def create 
    @var_a = ServiceA.new(opts).peform 
    
    if @var_a.success?
      @var_b = ServiceB.new(opts).peform
      if @var_b.success? 
        # handling success response
      else 
        render_error(@var_b.errors)
      end 
    else 
      render_error(@var_a.errors)
    end 
  end
end
```

Kode diatas sudah cukup kotor, dan bagaimana jika kita menambahkan satu lagi atau dua lagi kelas service, controller kita menjadi semakin sulit di kontrol, khususunya pada penanganan `errornya`.

Solusi dari masalah tersebut kita bisa menggunakan fitur eksepsi. Fitur eksepsi bisa langsung menghentikan alur program ketika dia menemukan terjadinya error, sehingga kita tidak perlu mengecek kondisi `apakah terjadi error?`. Untuk contoh penggunaannya bisa seperti kode dibawah ini. 

```ruby
class UsersController < ApplicationController
  def create
    begin
      ServiceA.new(opts).perform 
      ServiceB.new(opts).perform
    rescue => e 
      render_error(e)
    end
  end
end 
``` 

Pada masing-masing service tersebut kita bisa membangkitkan eksepsinya. 

```ruby
class ServiceA 
  def initialize(opts)
    # do setup
  end

  def perform 
    # do something 
    raise "User tidak boleh kosong" if user.nil?
    # do somtheng
    raise "User tidak memilki akses masuk" if user.member?
    
    # success and return something
  end
end 
```

Pada kelas `ServiceB` juga bisa mengikuti template dari `ServiceA`. Dengan kode seperti itu, maka ketika program membangkitkan eksepsi pertama (misalnya) maka alur akan berhenti, dan rails akan kembali ke controller dan mencari keyword `rescue` dan menjalankan blok kode yang didalamnya. 

Maka kode kita menjadi sangat bersih, bukan? penambahan kelas service pun tidak akan menjadi seseram kode sebelumnya (tanpa eksepsi). 

Kita juga masih bisa melakukan *refactor* pada kode diatas agar menjadi lebih bersih lagi dengan membuat kelas pada eksepsinya. Struktur yang mungkin saya sarankan untuk membuat kode lebih terawat. 

```
app/ 
  ... 
  services/ 
    users_services/
      /error 
        /user_not_found.rb
      create.rb 
      save.save
    students_services/ 
      /error
        /student_not_found.rb
      ...
  ...
```   

Untuk template errornya bisa menggunakan kode seperti ini: 

```ruby
class UserNotFound < StandardError 
  attr_reader :status 

  def initialize(opts)
    @status = opts[:status] || 404
    @message = opts[:message] || "User not found"

    super(@message)
  end
end 
```

Dengan template itu kita bisa melakukan seperti ini: 

```ruby
# app/services/user_service/show.rb
module UserService
  class Show
    # ... 
    raise Error::UserNotFound.new unless user 
  end
end 

# app/controllers/user_controller.rb 
class user_controller < ApplicationController
  def create 
    begin
    rescue => e 
      render_error(message: e.message, status: e.status)
    end
  end
end
```

Kita bisa melihat kode diatas, dengan membuat kelas costum error maka kita bisa mengoper nilai status error. Jika anda ingin ingin mengembalikan pesan array juga bisa, kodenya seperti ini 

```ruby
module UserService
  module Error 
    class UserNotFoundError < StandardError
      attr_reader :status, :full_messages

      def initialize(opts)
        @status = opts[:status]
        @message = opts[:message] || "User tidak ditemukan"

        add_messages(opts[:full_messages] || @message)

        super(@message)
      end

      def add_messages(messages)
        @full_messages = []
        @full_messages << messages
      end
    end
  end
end

## app/services/user_services/create.rb 
module UserService 
  class Create 
    # ...
    def perform
      # bussiness logic. 
      raise Error::UserNotFoundError.new(full_messages: user.errors.full_messages) unless user.valid?
    end
  end
end
```

Sangat kostumisasi sekali, bukan? namun kode tersebut masih cukup kotor, karena fungsi `add_messages(messages)` seharusnya bisa dibuat di dalam module `error` saja. Silahkan dicoba sendiri :)

### Catatan 
Mungkin sebelum mengakhiri tulisan ini, saya ingin beberapa catatan jika anda ingin mengimplementasikan konsep strategi ini dalam aplikasi anda. 

- Jangan menggunakan *nested* eksepsi, seperti kode dibawah ini. 
  ```ruby 
  begin
    # do something
  rescue => e
    begin
      # do something
    rescue => e
      # arghh >/<
    end
  end
  ``` 
  Kode seperti ini akan sangat sulit di perlihara, sebaiknya dihindari. 

- Jangan menangkap eksepsi error secara global di Ruby, contohnya seperti ini: 
  ```ruby
  begin
    # begin
    nil.perform
  rescue Exception => e 
    puts "ada failure"
  end
  ```
  Kode diatas akan menghasilkan keluaran "ada failure". Sungguh berbahaya sekali, karena itu yang kita tidak inginkan. Dengan kode seperti itu kita akan sulit menulis kode pada development atau melakukan *debuggging*-nya. 

  Namun bagaimana dengan kode kita sebelumnnya? Benar, sebelumnya kita tidak mengambil parameter apapun namun secara default ruby akan menangkap eksepsi `StandarError`.  
  ```ruby
  # kode ini adalah sama 
  begin
    # do something
  rescue StandardError => e 
    puts "ada failure"
  end

  begin
    # do something
  rescue => e 
    puts "ada failure"
  end
  ```  

  Namun jika kita lihat [hirarki dari eksepsinya](https://ruby-doc.org/core-2.1.1/Exception.html), maka kode ini masih menghasilkan "ada failure"
  ```ruby
  # kode ini adalah sama 
  begin
    # do something
    sum = 1 / 0 #> seharusnya runtime error `divided by zero`
    nil.perform #> seharusnya runtime error `running method in nil object`. 
  rescue StandardError => e 
    puts "ada failure"
  end
  ```

  Cukup mengerikan bukan? Namun kode diatas hanya bekerja pada Ruby dan bukan pada Rails. (Note: Karena saya sudah mencoba sendiri :D). Di rails kode diatas akan terjadi error `divided by zero`. Bahkan jika anda mengambil parameter global `Expection`. 

  ```ruby
  # kode ini adalah sama 
  begin
    # do something
    sum = 1 / 0 #> seharusnya runtime error `divided by zero`
    nil.perform #> seharusnya runtime error `running method in nil object`. 
  rescue Expection => e 
    puts "ada failure"
  end
  ```  
  
  Di Rails, kode diatas akan keluar error `divided by zero` sungguh mantap framework ini hahaha. 

  Namun mari kita berandai-andai, bagaimana jika keluaran Rails sama dengan keluaran Ruby, caranya adalah kita membuatnya seperti ini 

  ```ruby
  class CostumError < StandardError
  end

  class UserNotFound < CostumError
  end

  # app/controllers/users_controller.rb 
  def create
    begin 
    rescue CostumError => e 
      # handling failure
    end
  end
  ```

  Dengan kode seperti itu anda akan menghindari penangapan eksepsi dari `nil.perform` atau `sum = 1 / 0`. 

  - Ada satu lagi yang bisa kita refactor jika kita menggunakan konsep eksepsi. Kita sadar controller kita nyatanya belum terlalu `clean`, dengan mengikuti `sandi rules` satu method di controller hanya boleh hanya satu instansi saja. Sebelumnya `controller` kita seperti ini 
  ```ruby
  # app/controller/user_controller.rb 
  class UsersController < ApplicationController
    def create
      begin
        ServiceA.new(opts).perform 
        ServiceB.new(opts).perform
      rescue => e 
        render_error(e)
      end
    end
  end 
  ``` 

  Kita bisa refactornya seperti ini  

  ```ruby
  def create
    begin
      @workflow = UsersWorkflows::UserCreator.new(opts).run 
      # render success 
    rescue => e 
      render_error(e)
    end
  end 
  ```

  Pada kode diatas saya mengenalkan konsep workflow objek, yaitu kelas yang hanya bisa di instansi oleh controller. Sehingga servicenya bisa dipanggil di dalam kelas workflownya.
  
  ```ruby
  # app/workflows/users_workflows/user_creator.rb 
  module UsersWorkflows 
    class UserCreator 
      UserService::Create(opts).perform
      UserService::Show(opts).perform
    end
  end
  ```

  Jadi strukturnya kira-kira jadi seperti ini : 
  
  ```
  app/
    services/ 
      users_services/ 
      ... 
    workflows
      users_workflows/ 
      ...
    ...
  ```

### Penutup 
Terima kasih anda karena telah membaca tulisan sederhana saya ini, tulisan hanyalah opini saya dalam  menulis kode agar lebih bersih, karena saya sendiri masih belum banyak pengalaman dalam pengembangan perangkat lunak, maka tulisan ini masih banyak kekurangannya.

Arsitektur juga jelas masih banyak kekurangan, penamaan yang saya buat bukanlah sesatu yang pasti, jika anda ingin mengimplementasikannya, silahkan berunding dengan tim anda terlebih dahulu untuk mendapatkan nilai konsistensi yang lebih baik.
