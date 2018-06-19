---
layout: post
title: Pengenalan Devise
date: 29-01-2018
image: devise.png
tags: [otentikasi, otorasi, devise, rails]
---

Menggunakan devise untuk otentikasi dan otorisasi di ruby on rails.

Sedang membaca buku karya ryan bates dengan judul [rails 4 in action](https://www.manning.com/books/rails-4-in-action) yang memakai devise dalam projek otentikasinya, saya tertarik untuk membagikannya disini.

Sebenarnya, bukunya tersebut juga sudah lumayan lama, karena masih menggunakan rails 4. Jadinya saya mencoba untuk berhenti dan membaca dokumentasi terbaru devise [disini](http://devise.plataformatec.com.br/).

Tulisan ini sekedar pengantar, instalasi dan bagaimana implementasinya pada otentikasi.

## Setup Projek

```shell
$> rails new devise-test
```

Lalu tambahkan gem devisenya :

```shell
gem 'devise'
```

Dan jalankan perintah `bundle` di terminal.

## Install Devise

```shell
$> rails g devise:install
```

Lalu akan keluar pesan untuk mengupdate file config. Silahkan ikuti menambahkan kode di file config/environtments/development.rb :

```ruby
config.action_mailer.default_url_options = { host: 'localhost', port: 3000 }
```

Lalu buat model usernya.

```shell
$> rails g devise user
```

Maka instalasi sudah selesai.

## Membuat Tampilan Views

Sekarang kita membuat tampilan viewsnya, baik tampilan untuk halaman html, maupun template untuk mailernya.

```shell
$> devise g devise:install
```

Dengan perintah diatas, anda akan dibuatkan template viewsnya hingga routingnya.

Untuk detail routingnya anda bisa cek dengan :

```shell
$> rails routes
```

Lalu yang terakhir buatlah routing dan controller-views untuk rootnya.

Maka instalasi selesai, anda bisa memakainya.

## Sedikit Implementasi

Untuk halaman rootnya :


Dengan devise kita dapat menggunakan helper-helper bawaannya, silahkan kembali cek dokumentasinya untuk lebih lengkap.

`current_user` untuk mengeluarkan objek user yang login.

`user_signed_in?` metode untuk cek, apakah user sudah login?

Jika anda ingin otentikasi atau mengontrol akses di controller, anda bisa menggunakan seperti ini :

```erb
<h1>Welcome Pages</h1>
<% if user_signed_in? %>
  <p>Hi <%= current_user.email %></p>
  <p><%= link_to "Logout", destroy_user_session_path, method: :delete %></p>
<% else %>
  <p><%= link_to "Login Here", new_user_session_path %></p>
<% end %>
```

Jika anda ingin otentikasi atau mengontrol akses di controller, anda bisa menggunakan seperti ini :

```ruby
# app/controllers/welcome_controller.rb
class WelcomeController < ApplicationController
  before_action :must_signed_in, only: [:admin]

  def index
  end

  def admin
  end

  private
  def must_signed_in
    redirect_to root_path unless user_signed_in?
  end
end
```

Anda bisa juga menggunakan helper di controller seperti gambar diatas.

Devise memang sangat memudahkan pembuatan otentikasi, dimana hampir setiap projek kita pasti membuat fitur tersebut, namun saya menyarankan anda untuk mengetahui pembuatan otentikasi manual sebelum memakai devise saat produksi.

----
Anda baru saja menyelesaikan tulisan singkat tentang pengenalan devise, dari instalasi sampai akses kontrolnya.

Tulisan ini hanya pengantar saja, jika ingin mengetahui lebih dalam silahkan cek dokumentasinya.

Semoga dapat membantu, terima kasih.