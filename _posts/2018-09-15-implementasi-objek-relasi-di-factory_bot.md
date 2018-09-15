---
layout: post
title: Implementasi Objek Relasi di factory_bot
date: 15-09-2018
image: nyarons.jpg
tags: [factory_bot, tdd, ruby, rails]
---

Pada tulisan ini saya mencoba untuk berbagi hasil oprek tentang penulisan kode uji yang bekerja pada objek yang berelasi. Tulisan ini akan membahas sambil membuat sebuah contoh projek sederhana. Pada tulisan ini juga saya mencoba mencontohkan penulisan kode uji yang tidak baik khususnya pada bekerja dengan relasi objek yang mungkin anda gunakan. 

Ketika anda membuat sebuah projek dengan menggunakan lebih dari satu table dan terdapat kunci tamu pada table tertentu maka anda akan berkerja dengan objek yang berelasi. Contohnya adalah ketika anda ingin membuat sebuah fitur *role* pada user. Dimana fitur tersebut dapat membedakan user yang sebagai member dan user yang sebagai admin. Untuk implementasi fitur tersebut, maka anda membuat dua buah table yaitu role dan user. Anda bisa saja membuat satu table dengan menambahkan *field* admin, namun saya tidak menyarankan hal tersebut karena nilai skalabilitasnya cukup rendah. 
  
Sekarang, Mari kita masuk ke contoh projeknya. 

## Langkah pertama adalah membuat rails projek 
Jalankan perintah ini untuk membuat proyeknya. 
```bash 
$> rails new factory_bot_test  
```   

Setelah perintah selesai diproses, maka selanjutnya menambahkan *gem* `rspec-rails` dan `factory_bot_rails`. 

```ruby
group :development, :test do
  # Call 'byebug' anywhere in the code to stop execution and get a debugger console
  gem 'byebug', platforms: [:mri, :mingw, :x64_mingw]
  gem 'rspec-rails'
  gem 'factory_bot_rails'
end
```

Setelah itu jalankan perintah ini secara berurutan
```bash
$> bundle
$> rails g rspec:install 
```

## Mendesain struktur data
Struktur data yang akan digunakan pada proyek sederhana ini adalah: 

Role: (id, name)

User: (id, first_name, last_name, role_id)


## Membuat objek model `Role`
Sebelum menjalankan generator pembuatan model, ada baiknya kita melakukan menambahkan kode pada *config* agar factories-nya bisa digunakan pada pengujiannya. Pada file `rails_helper.rb` tambahkan kode ini.

```ruby
RSpec.configure do |config|
  # include factory_bot
  config.include FactoryBot::Syntax::Methods
  # ...
```

Setelah itu baru kita membuat generate modelnya, pada hal ini nanti otomatis rails membuat file factorinya untuk kita. 
```bash
$> rails g model role name 
```

Pada file `factories/role.rb` kita menulis kode ini: 
```ruby
FactoryBot.define do
  factory :role do 
    name { "costum" }
  end

  factory :admin_role, class: Role do 
    id { 1 }
    name { "admin" }
  end
  
  factory :member_role, class: Role do 
    id { 2 }
    name { "member" }
  end
end
```

Sedangkan untuk pengujiannya anda bisa menulis kode seperti ini: 
```ruby
require 'rails_helper'

RSpec.describe Role, type: :model do
  it "valid with name" do 
    role = build(:role, name: "member")
    role.valid? 
    expect(role.errors).to be_empty
  end

  it "is invalid without name" do 
    role = build(:role, name: nil)
    role.valid? 
    expect(role.errors[:name]).to include("can't be blank")
  end

  it "return's member name" do 
    role = build(:member_role)
    expect(role.name).to eq("member")
  end

  it "return's admin name" do 
    role = build(:admin_role) 
    expect(role.name).to eq("admin")
  end
end
```

## Membuat objek `User`
Setelah objek `Role` telah dibuat, sekarang saatnya membuat objek `User`. 

```bash
$> rails g model User name role:references 
```

Maka penulisan `factories/user.rb`-nya kita bisa buat menjadi seperti ini. 
```ruby
FactoryBot.define do
  factory :member_user, class: User do 
    first_name { "John" }
    last_name { "Laylor" }
    association :role, factory: :member_role
  end

  factory :admin_user, class: User do 
    first_name { "Super" }
    last_name { "Admin" }
    association :role, factory: :admin_role
  end
end
```

Anda tidak perlu membuat data seeder pada kode test anda yang akan membuat testnya menjadi kebergantungan. Apalagi pada `rails`, seeder pada test adalah seeder yang anda gunakan pada development yang membuat banyak data-data yang tidak digunakan pada database test anda. 

Contoh penulisan kode test yang buruk (yang saya lakukan dulu :p)
```ruby
FactoryBot.define do
  factory :member_user, class: User do 
    first_name { "John" }
    last_name { "Laylor" }
    role_id 2
  end

  factory :admin_user, class: User do 
    first_name { "Super" }
    last_name { "Admin" }
    role_id 1
  end
end
```

Kode diatas ini adalah contoh kode yang kurang baik. Kode uji yang baik adalah kode yang bisa berdiri secara mandiri. 


Sekarang anda bisa mencoba menulis kode test pada model usernya. 

```ruby
require 'rails_helper'

RSpec.describe User, type: :model do
  let (:member_user) { build(:member_user) }
  let (:admin_user) { build(:admin_user) }

  it "valid with first_name, last_name and role" do
    member_user.valid? 
    expect(member_user.errors).to be_empty
  end

  it "invalid without first_name" do
    member_user.first_name = nil 
    member_user.valid? 
    expect(member_user.errors[:first_name]).to include("can't be blank")
  end

  it "valid without last_name" do 
    member_user.last_name = nil
    member_user.valid? 
    expect(member_user.errors[:last_name]).to be_empty
  end

  describe "#name" do 
    context "with first_name and last_name" do
      it "return first_name and last_name" do 
        expect(member_user.name).to include("#{member_user.first_name} #{member_user.last_name}")
      end 
    end

    context "with first_name and without last_name" do 
      it "return first_name" do
        member_user.last_name = nil
        expect(member_user.name).to eq(member_user.first_name)
      end
    end
  end

  describe "#role" do
    context "admin role" do 
      it "id = 1" do 
        expect(admin_user.role.id).to eq(1)
      end

      it "name = 'admin'" do 
        expect(admin_user.role.name).to eq("admin")
      end
    end 

    context "member role" do 
      it "id = 2" do
        expect(member_user.role.id).to eq(2)
      end

      it "name = 'member" do 
        expect(member_user.role.name).to eq("member")
      end
    end
  end
end
```

-----
Cukup sekian tulisan kali ini, semoga dapat membantu pembaca sekalian. 









