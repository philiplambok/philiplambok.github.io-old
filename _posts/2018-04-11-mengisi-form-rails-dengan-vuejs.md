---
layout: post
title: Mengisi Form Rails dengan Vue
date: 11-04-2018
image: p-chan.png
tags: [frontend, rails, vue, form, ajax]
---

Perpaduan Karen dengan P-chan sama dengan perpaduan Rails dan Vue, hehehe..

Tulisan ini akan membahas menggunakan vue js dalam input lewat from di rails. Tulisan ini akan menggunakan vue js dan es6 dalam pengkodeannya. Untuk instalasi silahkan liat dokumentasinya masing-masing atau lewat tulisan sebelumnya.

Seperti sebelumnya, dalam pembahasan kita sambil membuat sebuah projek agar pembahasan bisa lebih mendekati realita. Kita akan membuat projek untuk input anime baru dan menampilkannya.

Silahkan buat project dan install paket `vuejs-rails`, serta hapus gem `coffee-script` karena kita akan menggunakan es6.

# Membuat Model
Mari kita mulai dengan pembuatan model terlebih dahulu.

```bash
$> rails g model anime name
```

Atributnya cukup nama saja.

## Membuat Controller
Sekarang mari buat controllernya.

```bash
$> rails g controller animes new
```

Lalu setting ruotenya,

```rb
Rails.application.routes.draw do
  root 'animes#new'
  resources :animes
end
```

## Edit application.html.erb
Lalu kita edit layoutnya, sesuai dengan konfigurasi di Vue.

```html
<%= yield :template %>

<div id="app">
  <%= yield %>
</div>
```

Saya juga membuat file template terpisah dengan layout agar kode lebih bersih. Penulisan ini sempat disinggung pada tulisan sebelumnya.

Sekerang tinggal membuat helper untuk rendernya.

```rb
def render_template(params)
  content_for :template do
    render "templates/#{params}"
  end
end
```

## Edit file viewnya
Sekarang kita mengedit file view untuk inputnya. Dalam kasus ini saya ingin sekaligus memperkenalkan konsep *nested component*, jadi saya hanya menulis tag `<anime>` saja pada viewnya, namun pada realitas kembali lagi pada rancangannya masing-masing.

```html
<% render_template "animes" %>

<h2>Animes Project</h2>

<animes></animes>
```

## Membuat template untuk komponentnya
Sekarang kita membuat template untuk komponennya, saya membuatnya menjadi satu file saja.

Pada file `views/templates/_animes.html.erb`

```html
<template id="add-new-anime-template">
  <div>
    <%= form_with model: @anime, url: animes_path, method: :post do |f| %>
      <%= f.text_field :name, "v-model": "anime.name" %>
      <%= f.submit "New anime", "@click.prevent": "addNewAnime()" %>
    <% end %>
  </div>
</template>

<template id="animes-template">
  <div>
    <add-new-anime :animes="animes"></add-new-anime>
    <button @click="loadAnimes">Refesh</button>
    <li v-for="anime in animes">
      {{ anime.name }}
    </li>
  </div>
</template>
```

`animes-template` adalah parent komponennya, didalamnya adalah `add-new-anime-template`.

Sebelum lanjut jauh lagi, mari kita setting file `application.js`-nya terlebih dahulu.

```js
// ...
//= require vue
//= require vue-resource
//= require_tree .

// global bus for communication
bus = new Vue()


window.addEventListener('load', function(){
  app = new Vue({
    el: "#app",
  })
})
```

Karena kita menggunakan konsep `nested-component` maka kita perlu variable yang akan menjadi komunikasi antar element *parent* dengan *child* karena vue js tidak menyediakan sinkronisasi secara dua arah pada konsep tersebut.

## Edit animes.js
Sekarang waktunya untuk mengkodekan file js pada komponennya.

```js
// Place all the behaviors and hooks related to the matching controller here.
// All this logic will automatically be available in application.js.

Vue.component('animes', {
  template: '#animes-template',
  data() {
    return {
      animes: null
    }
  },
  methods: {
    loadAnimes(){
      this.$http.get("/animes.json")
      .then(function(response){
        this.animes = response.body
      })
    }
  },
  mounted(){
    this.loadAnimes()
  },
  created(){
    bus.$on('added', this.loadAnimes)
  }
})


Vue.component("add-new-anime", {
  template: "#add-new-anime-template",
  data() {
    return {
      anime: {
        name: "",
      }
    }
  },
  methods: {
    addNewAnime(){
      body = {
        anime: this.anime
      }

      headers = {
        "X-CSRF-Token": document.querySelector("meta[name='csrf-token']").getAttribute("content")
      }

      this.$http.post('/animes', body, { headers: headers})
        .then(function(response){
          bus.$emit('added')
          this.anime.name = ""
        })
    }
  }
})
```

Saya menggunakan `vue-resources` untuk ajaxnya. Banyak versi yang boleh dipakai, seperti axios, maupun native. Dalam request-nya saya menggikutkan headers `X-CSRF-Token`, karena secara default rails mempunyai keamanan untuk deteksi bot masuk dan menggunakan aplikasi web.

Jika anda sebelumnya sudah pernah menggunakan mengkodekan vuejs pada input melalui form dan men-disablekan `CSRF-Token` sebaiknya anda mengaktifkan kembali karena sangat berguna untuk keamanan website anda.

Catatan: saya menggunakan variable `bus` tadi untuk komunikasi antara `parent` dan `child` komponennya. `bus.$emit('event')` untuk membangkitkan event, sedangkan `bus.$on('event')` untuk listen.

Terakhir kode controllernya: `animes_controller.rb`
```rb
class AnimesController < ApplicationController
  def index
    @animes = Anime.all

    respond_to do |format|
      format.json { render json: @animes }
    end
  end

  def new
    @anime = Anime.new
  end

  def create
    @anime = Anime.new anime_params

    @anime.save

    render json: @anime
  end

  private
  def anime_params
    params.require(:anime).permit(:name)
  end
end
```

Silahkan serve `rails s` dan buka browser anda ke `/localhost:3000`, maka project sudah bisa dinikmati.

----
Terima kasih anda baru saja menyelesaikan tulisan tentang input form di rails menggunakan Vue.js. Semoga tulisan ini dapat membantu dan bermamfaat bagi pembaca skalian.
