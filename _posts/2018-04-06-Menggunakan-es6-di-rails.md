---
layout: post
title: Menggunakan ES6 di Rails
date: 06-04-2018
image: jsgirl.png
tags: [frontend, vuejs, rails]
---

Pada [tulisan sebelumnya](https://philiplambok.github.io/2018/04/05/menggunakan-vue-di-rails.html), saya menyinggung tentang penggunaan coffescript. Disana saya memilih untuk menggunakan javascript dibandingkan coffescipt.

Javascript saat ini perkembangannya saat deras sekali, selain ia menjadi bahasa pemrograman paling populer saat ini. Sayangnya jika anda ingin menggunakan ES6 (Versi terbaru javascript saat ini) di rails, anda akan menemukan kesalahan (error) saat produksi. Namun saat development biasanya anda akan tidak dikenakan error.

Yang disayangkan juga, secara default rails masih menggunakan coffescript. Coffescript memang sintaknya mirip ruby, jika anda programmer ruby akan mudah untuk mempelajarinya, namun tetap saja pasti ada yang kurang.

Tulisan ini akan berbagi tentang cara membuat rails secara default akan menggunakan ES6, baik pada produksi hingga development maupun saat *generators*. Sebenernya caranya cukup mudah, anda tidak perlu menginstall webpack hingga mengatur configurasi gulp pada babelscript.

Anda hanya edit file configurasi pada file *config/environtments/production.rb*.

```rb
# from
config.assets.js_compressor = :uglifier

# to
config.assets.js_compressor = Uglifier.new(harmony: true)
```

Cukup.

Sekarang tinggal hapus coffescript dari Gemfile

```rb
# gem 'coffee-rails', '~> 4.2'
```

Untuk testing silahkan membuat controller dan file jsnya.

```bash
$> rails g controller welcome index
```

Maka anda akan dibuatkan file `welcome.js` dan bukan dengan ekstensi `.coffee`. Agar lebih *updol* silahkan tambahkan javascript dengan format ES6 pada file `welcome.js`.

```js
class Test{
  constructor(msg){
    this.msg = msg
  }

  show(){
    alert(this.msg)
  }
}

new Test('Hello, World').show()
```

Lalu registerkan routesnya.

```rb
Rails.application.routes.draw do
  root 'welcome#index'
end
```

Selesai, anda boleh lakukan deploy pada heroku atau vendor favorite anda.

-----
Terima kasih anda baru saja menyelesaikan tulisan tentang penggunaan ES6 pada rails, semoga tulisan ini dapat bermamfaat bagi pembaca skalian.