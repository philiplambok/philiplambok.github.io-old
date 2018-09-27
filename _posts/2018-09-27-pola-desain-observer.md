---
layout: post
title: Mengenal Pola Desain Observer, pola untuk handle integrasi objek-objek anda.
date: 27-09-2018
image: aoyama.jpg
tags: [design pattern, ruby, rails]
---

Apakah anda pernah membuat program yang terintegrasi antara beberapa objek seperti misalnya pembuatan log atau notifikasi, contohnya ketika anda membuat fitur pembayaran dimana setelah pembayaran berhasil anda perlu melakukan notifikasi dan log kepada user anda.

Observer adalah sebuah pola desain yang berguna untuk menangani integrasi antara satu objek dengan objek lain seperti pada kasus yang diatas. Tulisan ini akan mencoba berbagi hal tersebut dengan memperlihatkan studi kasusnya. 

Contohnya kita sedang membuat proyek internal pada perusahaan tertentu dimana kita ditugaskan untuk menambahkan fitur pada sistem agar dapat menambah atau mengurangi gaji karyawan tertentu dan menambahkan log dan notifikasi padanya. 

Mari kita buat fitur tersebut pertama-tama dengan tanpa mengimplementasikan pola desain apa-apa. 

```ruby
class Log
  def self.update(employment)
    puts "Log: #{employment.name} gajinya berubah menjadi #{employment.salary}"
  end
end

class Notification 
  def self.update(employment)
    puts "Notification: #{employment.name} gaji anda berubah menjadi #{employment.salary}"
  end
end

class Employment 
  attr_accessor :name, :salary 

  def initialize(opts)
    @name = opts[:name]
    @salary = opts[:salary]
  end

  def salary=(salary)
    @salary = salary
    Log.update(self)
    Notification.update(self)
  end
end

pquest = Employment.new(name: "pquest", salary: "Rp. 1.000.000")
pquest.salary = "Rp. 1.400.000"
```

Akan menghasilkan keluaran: 
```
Log: pquest gajinya berubah menjadi Rp. 1.400.000
Notification: pquest gaji anda berubah menjadi Rp. 1.400.000
```

Anda mungkin berfikir kodenya sudah cukup bersih. Mungkin iya, tapi bagaimana jika anda penambahan-penambahan permintaan di kemudian hari yang mungkin anda disuruh membuatkan log juga untuk setiap departement pada perusahaan tersebut. Mungkin kode ini sudah tidak relevan lagi. 

Maka, solusinya anda bisa mencoba dengan pola desain observer seperti pada kode berikut ini: 
```ruby
class Employment 
  attr_reader :name, :salary

  def initialize(opts)
    @name = opts[:name]
    @salary = opts[:salary]
    @observers = [Log.new, Notification.new]
  end

  def salary=(salary)
    @salary = salary
    notify_observers
  end

  def notify_observers
    @observers.each do |obs|
      obs.update(self)
    end
  end
end

class Log
  def update(employment)
    puts "Notification: #{employment.name} gaji anda berubah menjadi #{employment.salary}"
  end
end

class Notification 
  def update(employment)
    puts "Log: #{employment.name} gajinya berubah menjadi #{employment.salary}"
  end
end

pquest = Employment.new(name: "pquest", salary: "Rp. 1.000.000")
pquest.salary = "Rp. 1.400.000"
```

Kode diatas akan menghasilkan keluaran yang sama dengan kode yang sebelumnya. 

Bagaimana lebih bersih bukan ? Khusus pada ruby pada pola ini juga menyediakan paket khusus yang bernama `observer`. Cara menggunakan paket tersebut dengan menambakan perintah `include bservable` pada subjek, pada kasus ini adalah kelas `Employment`, sedangkan kelas `Log` dan `Notification` dinamakan observer. 

Contoh kode jika menggunakan paket `observer`:
```ruby
require 'observer'

class Employment 
  attr_reader :name, :salary
  include Observable

  def initialize(opts)
    @name = opts[:name]
    @salary = opts[:salary]
    add_observer(Log.new)
    add_observer(Notification.new)
  end

  def salary=(salary)
    @salary = salary
    changed
    notify_observers(self)
  end
end

class Log
  def update(employment)
    puts "Notification: #{employment.name} gaji anda berubah menjadi #{employment.salary}"
  end
end

class Notification 
  def update(employment)
    puts "Log: #{employment.name} gajinya berubah menjadi #{employment.salary}"
  end
end

pquest = Employment.new(name: "pquest", salary: "Rp. 1.000.000")
pquest.salary = "Rp. 1.400.000"
```

Dimana, hasil keluarannya tetap sama dengan kode-kode yang sebelumnya. 

Jika anda lihat, paket ini menambahkan metode `changed` yang digunakan untuk membangitkan notifikasi. Kode ini bisa digunakan jika anda tidak ingin membuat log dan notifikasi jika salary yang baru sama dengan salary yang lama, dengan mengubah kode menjadi:
```ruby
def salary=(salary)
    changed unless @salary.eql?(salary)

    @salary = salary
    notify_observers(self)
  end
```

Jika anda ingin lebih dalam mengenal paket ini anda bisa membacanya di [dokumentasi ruby](http://ruby-doc.org/stdlib-2.0.0/libdoc/observer/rdoc/Observable.html). 

---- 
Terima kasih telah membaca, semoga dapat membantu pembaca skalian. 