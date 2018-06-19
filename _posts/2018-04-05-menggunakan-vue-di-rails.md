---
layout: post
title: Menggunakan Vue di Rails
date: 05-04-2018
image: vuegirl.png
tags: [frontend, vuejs, rails]
---

Tulisan kali ini akan mengulas bagaimana memakai vue.js di rails. Vue adalah framework javascript yang cukup populer saat ini. Jika anda baru di Vue, anda boleh membaca buku [Majesty of Vue.js 2](https://leanpub.com/vuejs2). Buku ini sangat mudah dipahami jika anda baru mulai belajar Vue.

Jika anda sudah cukup lama mengenal vue dan sudah pernah mencoba mengintegrasikan vue pada rails dengan embel-embel *single file component*-nya, biasanya mereka akan mengarahkan anda untuk menggunakan webpack. Penggunakan webpack + *single file component .vue* sangat cocok untuk pembuatan PWA (*Progressive web app*) namun sayangnya perlu usaha lebih dalam melakukan kodenya.

Jika anda hanya perlu memakai vue pada beberapa komponen di projek anda, tulisan ini cocok anda. Tulisan ini adalah hasil resep saya yang saya pakai pada projek saya, semoga dapat membantu para pembaca.

## Instalasi
Projek yang akan dibuat sederhana saja, kita akan membuat sebuah list. Pada kasus ini, saya ingin membuat list waifu. Waifu sebutan untuk karakter favorit dalam sebuah film.

```
$> rails new waifu-list
```

## Menambahkan gems
Kita akan menambahkan gem bootstrap dan gem vue

```rb
# filename: Gemfile

# use bootstrap
gem 'bootstrap', '~> 4.0.0'

# use vue
gem 'vuejs-rails'
```

## Membuat model dan controller
Mari buat model waifu-nya terlebih dahulu.

```
$> rails g model Waifu name
```

Setelah itu isi seedernya.

```rb
# filename: db/seeds.rb
100.times do |index|
  Waifu.create name: "Rem ke-#{index}"
end
```

Lalu buatlah controllernya.

```
$> rails g controller waifus index
```

Terakhir set routingnya.
```rb
# Filename: config/routes.rb

Rails.application.routes.draw do
  root "waifus#index"
  get 'waifus/index', to: 'waifus#index'
end
```

## Kode dalam controller
Sekarang mari kita lakukan kode dalam controllernya. Logikanya cukup mudah kita hanya menampilkan json dan html untuk sebuah list waifus.

```rb
# Filename: app/controllers/waifus_controller.rb

class WaifusController < ApplicationController
  def index
    @waifus = Waifu.all

    respond_to do |format|
      format.json { render json: @waifus }
      format.html { render 'index' }
    end
  end
end
```

## Membuat instansi objek Vue
Membuat instansi dari vue terlebih dahulu, sebelum kita masuk ke dalam pembuatan komponen.

Silahkan tambah kode berikut ini, sebelumnya

```js
// Filename: app/assets/javascripts/application.js
//= require vue
//= require vue-resource
```

Setelah itu baru tambahkan kode ini

```js
// Filename: app/assets/javascripts/application.js
window.addEventListener('load', function(){
  app = new Vue({
    el: '#app',
    data: {
      waifus: [],
    },
    methods: {
      getAllWaifus: function(){
        this.$http({url: '/waifus/index.json', method: 'GET'})
          .then(function(response){
            this.waifus = response.body
          })
      }
    },
    created: function(){
      this.getAllWaifus()
    }
  })
})
```

Pada kode diatas, saya sudah skalian mengisi objek dari routes json yang sebelumnya sudah kita kodekan. Jika anda lihat sebelum kita membuat variable app, kita perlu memanggil event load pada window terlebih dahulu, dimana hal itu akan membuat instansi terjadi setelah halaman telah di *render*.

## Membuat template
Saya lebih suka membuat template di file yang berbeda dengan js. Dimana ketika kita ingin membuat hal tersebut, kita perlu melakukan *define* template diluar tag `div#app`.

Maka mari tambahkan kode berikut ini pada file `app/views/layouts/application.html.erb`.

```html
<body>
  <%= yield :template %>

  <div id="app">
    <div class="container">
      <%= yield %>
    </div>
  </div>
</body>
```

Lalu kita tambahkan helper untuk mengisi *yield*-nya. Saya menambahkannya pada file `application_helper`.
```rb
module ApplicationHelper
  def render_template(name)
    content_for :template do
      render "templates/#{name}"
    end
  end
end
```

Setelah itu buatlah file templatenya di folder khusus agar lebih rapih. Saya membuatnya di `app/views/templates/_waifus.html.erb`

```html
<template id="waifus">
  <div class="waifus my-4">
    <ul class="list-group">
      <li class="list-group-item" v-for="waifu in waifus" :key="waifu.id">
        waifu.name
      </li>
    </ul>
  </div>
</template>
```

Catatan: template string untuk menampilkan nilai tidak tampil oleh markdown. Jadi, silahkan pembaca tambahkan sendiri.

Lalu kita register templatenya di file `app/assets/javascripts/waifus.js`. File ini biasanya secara default ditambahkan saat kita men-*generate* controller tadi. Filenya juga sebenernya berformat `.coffee`, namun saya tidak terlalu terbiasa menulis js dalam format tersebut. Saya lebih memilih mengganti formatnya ke `.js`, namun jika anda terbiasa menggunakan format `.coffee`, anda boleh tidak menggantinya. Semua kembali lagi ke selera masing-masing.

```js
Vue.component('waifus', {
  template: '#waifus',
  props: ["waifus"]
})
```

## Menampilkan komponen
Langkah yang terakhir yaitu menampilkan komponent pada file `app/views/waifus/index.html.erb`

```html
<%= render_template('waifus') %>

<waifus :waifus="waifus"></waifus>
```

Anda boleh lakukan serve, dan kunjungin `http://localhost:3000/, maka list waifu sudah tampil.


---
Terima kasih telah membaca tulisan singkat tentang cara menggunakan vue.js pada rails, semoga tulisan ini dapat membantu para pembaca skalian.













