---
layout: post
title: Menggunakan JWT Token di Rails
date: 16-07-2018
image: ayano.jpg
tags: [jwt-token, ruby , rails, api]
---

Teknologi terus berkembang saat ini, mengembangkan projek perangkat lunak dengan API atau  memisahkan teknologi frontend dengan backend sudah menjadi hal yang lumrah. Tulisan ini akan mengulas cara otentikasinya jika anda melakukan hal tersebut. 

Tulisan ini khusus membahas bagaimana cara otentikasinya saja menggunakan JWT, namun pada akhir tulisan anda akan diberikan kode projek CRUD backend dengan rails.

## Pengantar JSON Web Token 
JSON Web Token atau sering disingkat menjadi [JWT](https://jwt.io/introduction/) adalah sebuah salah satu solusi atas permasalahan pada teknologi API. Dengan memisahkan backend dengan frontend memberikan keuntungan skalibilitas, dimana anda dapat dengan mudah mengembangkan aplikasi anda pada platfrom atau server lain, misalnya aplikasi android, ios, dekstop, maupun aplikasi web.

Namun khususnya untuk otentikasi kita mendapat permasalahan, yaitu kita tidak bisa menyimpan session atau data yang sudah dienkripsi dari backend kita ke plafrom yang berbeda seperti android, ios maupun pada server atau vendor yang berbeda (konsumer API kita). 

Untuk masalah tersebut, kita bisa menggunakan JWT. 

## Menggunakan JWT di Ruby 
Pada tulisan ini saya hanya menggunakan `'jwt'` saja, agar konsep bisa dicerna dengan baik.

```ruby
gem 'jwt'
```

Tambahkan kode diatas pada projek rails anda, dan jalankan `bundle`. 

JWT menggunakan dua fungsi utama, yaitu melakukan enkripsi dan dekripsi. Enkripsi, yaitu mengubah informasi menjadi karakter acak random, sedangkan dekripsi bertugas mengubah karakter yang random tadi menjadi informasi. 

### Melakukan Ekripsi 
Mengubah data atau informasi menjadi string acak. 
```ruby
require 'jwt'

payload = { data: "ayano is best waifu" }

token = JWT.encode payload, nil, 'none' #> "eyJhbGciOiJub25lIn0.eyJkYXRhIjoicmVtIn0."
```

Token pada jwt didapat dari hasil perpaduan `algoritma.data.kode_rahasia`, jika anda ingin belajar lanjut tentang teori atau cara kerja dari JWT anda bisa lihat [disini](https://jwt.io/introduction/). 

### Melakukan Deskripsi 
Mengubah string acak menjadi sebuah infromasi. 
```ruby
JWT.decode token, false, nil #> [{"data"=>"rem"}, {"alg"=>"none"}]
```

Decode akan menghasilkan array dari data dan algoritma yang dipakai. 

## Mengunakan JWT di Rails 
Sekarang kita mencoba untuk mengimplementasikannya di sebuah projek. 

Buat rails projek baru. Karena kita hanya menggunakan API tidak ada views, maka saya merekomendasikan untuk membuat projeknya dengan perintah : 

```bash
rails new ayano --api  
```

Kita hanya membuat projek untuk otentikasi saja, anda boleh menamainya apa saja :) 

Sekarang buat model `user` dan controller `auth`, `home`

```bash
rails g model User username password_digest 
rails g controller auth
rails g controller home   
```

Kita akan menggunakan enkripsi `bcrypt` di sisi database, jadi tambahkan kode ini pada gemfile. 

```ruby
gem 'bcrypt' 
```

Lalu jalankan `bundle`. 

Sekarang tambahkan user secara manual, baik lewat seeder atau rails c. 

Setelah data user disimpan, sekarang kita membuat fitur login atau sign in pada controler auth. 

Untuk routesnya kira-kira seperti ini: 

```ruby 
Rails.application.routes.draw do 
  namespace :api do 
    resources :auth, only: [:create]
    resoruces :home, only: [:show]
  end
end
```

Untuk auth controllernya :  

```ruby
class Api::AuthController < ApplicationController
  before_action :set_user, only: [:create]
  before_action :validate_authenticity_user, only: [:create] 
  before_action :set_token, only: [:create]
  
  def create
    json_response({ jwt: @token })
  end

  private 
  def set_user 
    @user = User.find_by_username(params[:auth][:username])
  end

  def validate_authenticity_user
    non_authenticated_message unless @user && @user.authenticate(params[:auth][:password])
  end

  def non_authenticated_message 
    error_response code: 401, message: "username or password is wrong"
  end

  def set_token
    @token = generate_token(@user)
  end
end
```

Kode di atas menggunakan AuthHelper untuk melakukan enkripsi dan dekripsi. Oh iya, pada projek api-only saat membuat controller anda tidak disediakan helper, maka untuk membuat helpernya secara manual `rails g helper auth`. 

```ruby
module AuthHelper
  def generate_token(user)
    payload = { user_id: user.id }
    JWT.encode payload, nil, 'none'
  end

  def decode_token(token)
    JWT.decode token, nil, false
  end

  def authenticated?
    return false unless validate_headers
    return false unless validate_token

    # returns true is pass validation 
    true
  end

  def validate_headers 
    auth_headers = request.authorization

    # headers must be not empty
    return false unless auth_headers

    # split headers to arrays 
    auth_headers = auth_headers.split

    # headers must have 2 items 
    return false unless auth_headers.count == 2 

    # headers[0] must be return string "Bearer"
    return false unless auth_headers[0] == "Bearer"
    
    # returns true if pass validations 

    true
  end

  def validate_token
    # check avaiability user_id 
    return false unless user_id

    # returns true if pass validations 
    true
  end

  def token
    request.authorization.split[1]
  end

  def user_id
    begin
      decode_token(token)[0]["user_id"]
    rescue
      nil 
    end
  end

  def current_user
    current_user ||= User.find_by_id(user_id)
  end
end
```

Sebenarnya pada fitur login, kita hanya akan menggunakan method `generate_token`, namun jika di projek anda ingin menampilkan `current_user` yang sedang login, atau method untuk melakukan validasi, anda bisa menggunakan kode-kode di atas. 

Untuk testing aplikasi anda bisa menggunkan *postman*. Silahkan request method POST di url `auth` dengan body : 
```json
{
  "auth": {
    "username": "pquest", 
    "password": "secretcode"
  }
}
```
Maka anda akan diberikan hasil respon : 
```json
{
  "jwt": "your_token_here"
}
```

Maka, anda sudah berhasil login ke dalam sistem. Sekarang untuk request selanjutnya anda harus meng-*include* token di atas pada header anda. Token diatas anda bisa simpan menggunkan javascript (`document.cokkie` atau `window.localStorage`).

Format headernya [Ref](https://jwt.io/introduction/) : 
```
Authorization: Bearer <your_token_token>
``` 

Jika anda sudah menyimpan token pada header anda, maka sekarang lakukan request kepada home untuk mengecek status otentikasi. 

```ruby
class Api::BlogsController < ApplicationController
  before_action :must_signed_in, only: [:index]

  # listing blogs 
  def index 
    json_response(current_user) 
  end

  private
  def must_signed_in
    non_authenticated_message unless authenticated? 
  end

  def non_authenticated_message 
    error_response code: 401, message: "Sorry, you must signed in."
  end
end
```

Maka, jika anda respon sekarang, jika token benar, sistem akan menampilkan respon objek `user` yang sedang login sekarang. 

fungsi `json_response` dan `error_response` didapat kode di dalam `application_controller` seperti di bawah ini : 

```ruby
  def json_response(object) 
    render json: object
  end

  def error_response(options)
    error = { code: options[:code], message: options[:message] }

    render json: error 
  end
```

Kode diatas juga mengembalikan respon jika kode token tidak sesuai format atau bahkan salah. 

------
Anda sudah membaca tulisan singkat ini tentang penegimplementasian jwt token pada rails. 
Jika anda tertarik dengan implementasian CRUD lengkap berserta otorisasinya (*role*), saya telah membuat contoh projeknya [disini](https://github.com/philiplambok/ayano).

Projek diatas adalah projek untuk sharing links. User dapat menyimpan koleksi link, mengeditnya, menghapusnya dan melihat koleksi dari user lain. Pada projek ditas juga sudah dilengkapi dengan konsep *authorization*, yaitu adanya admin dan user tidak boleh sembarang edit dan menghapus link dari user lain. 

Untuk menggunakannya anda bisa lihat file [README.md](https://github.com/philiplambok/ayano/blob/master/README.md), disitu sudah saya tulis fitur-fiturnya dan endpoints apinya hingga *error handling*-nya. 

Tulisan ini masih banyak kekurangan, namun semoga dapat bermamfaat bagi pembaca skalian. 

Terima kasih.  




