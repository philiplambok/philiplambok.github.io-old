---
layout: post
title: Authenticator, sebuah service object pada Rails untuk menangani otentikasi dengan JWT.
date: 19-09-2018
image: ayano-smile.jpg
tags: [authentication, jwt, service object]
---

Kali ini saya ingin berbagi tentang bagaimana menangani otentikasi dengan JWT menggunakan service objek. Service objeknya sendiri saya namakan Authenticator, objek ini di desain oleh saya secara sederhana hanya untuk menggambarkan bagaimana konsep service objek ini diimplementasikan. 

Jika anda belum mengetahui JWT itu apa, mungkin anda bisa membaca [tulisan sebelumnya](https://philiplambok.github.io/2018/07/16/menggunakan-jwt-token-di-rails.html).

## Membuat proyek baru
Buatlah proyek rails-api baru. `rails new jwt_auth --api`. 

Setelah itu lakukan `bundle`.

Lalu buka `Gemfile` dan tambahkan `gem 'jwt'` dan hapus komentar pada `gem bcrypt` pada file tersebut dan jalankan `bundle` kembali. 


## Membuat model dan controller
Karena kita ingin membuat fitur otentikasi, maka kita akan membuat model user dan auth_controller. 

Buat model user dengan perintah `rails g model user username password_digest` dan tambahkan *callback* `has_secure_password` pada model User. 

Lalu buat controller dengan perintah `rails g controller auth` dan register `routes.rb`. 

```ruby
Rails.application.routes.draw do
  post 'auth', to: 'auth#create'
  get 'auth', to: 'auth#show'
end
```

`post 'auth'` untuk membuat tokennya, sedangkan pada `get 'auth` untuk *decode* atau menampilkan objeknya. Untuk penampilan objek usernya tulisan tidak menggunakan `serializer` agar lebih sederhana, namun jika pembaca akan menggunakannya pada produksi, saya sangat menyarankan untuk menggunakan `serializer`. 

Sekarang mari kita buat controllernya seperti kode dibawah ini
```ruby
class AuthController < ApplicationController
  def show 
    render json: { user: Authenticator.new(token_params).user }
  end

  def create 
    render json: { jwt: Authenticator.new(auth_params).token }
  end

  private
  def auth_params
    params.require(:auth).permit(:username, :password)
  end

  def token_params
    { auth_header: request.authorization }
  end
end
```

## Membuat *service object* Authenticator

Objek ini digunakan untuk mengatasi masalah-masalah yang terkait otentikasi, kodenya sebagai berikut: 

```ruby
class Authenticator
  attr_accessor :token, :user
  
  def initialize(options)
    if options[:auth_header]
      set_user(options[:auth_header])
    else 
      set_token(options[:username],options[:password])
    end
  end

  private 
  def set_token(username, password)
    @user = User.find_by(username: username)
    if @user && @user.authenticate(password)
      @token = generate_token(username: @user.username)
    end
  end

  def set_user(auth_header)
    @token = filter_auth_header(auth_header)
    payload = decode_token(@token) if @token
    if payload
      @user = User.find_by(username: payload["username"])
    end
  end
  
  def generate_token(payload) 
    JWT.encode(payload, nil, 'none')
  end

  def decode_token(token)
    begin
      decoded_token = JWT.decode(token, nil, false)
      decoded_token[0]
    rescue
      nil
    end
  end

  def filter_auth_header(auth_header) 
    auth_header = auth_header.split
    return false if auth_header[0] != "Bearer" 
    auth_header[1]
  end
end
```

Jelas, proyek ini masih sangat bisa untuk dilakukan *refactor* agar lebih bersih dan lebih mudah dipahami, namun penulisan ini hanya berfokus pada contoh implementasiannya saja.

## Tambahan
Jika anda membuat proyek ini tanpa perintah `--api`, maka dapat dipastikan anda dapat menjalankan proyek tersebut dengan tidak ada hambatan, namun jika anda membuat proyek dengan perintah tersebut sama seperti yang saya lakukan yaitu menggunakan `--api` maka kemunkinan besar akan terjadi *error*. 

*Error* tersebut ada karena pada *rails-api-only* projek tidak meng-*include* service objek secara otomatis, namun kita perlu melakukan secara manual dengan menambahkan baris kode berikut ini pada file `config/application.rb`. 

```ruby
config.autoload_paths += %W(#{config.root}/app/services)
``` 

Perintah tersebut untuk menambahkan folder `app/services` pada *autoload* projek.

----
Terima kasih telah membaca tulisan sederhana ini, semoga dapat berguna bagi pembaca skalian. 

