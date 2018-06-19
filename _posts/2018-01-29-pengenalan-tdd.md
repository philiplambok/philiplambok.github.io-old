---
layout: post
title: Pengenalan TDD dengan RSpec dan Capybara
date: 29-01-2018
image: testing-problem.png
tags: [ruby, programming, Rspec, Capybara]
---

Membuat project dengan metodologi testing memang akan melambat pekerjaan, karena kita harus menulis kode testingnya dulu, tapi akan menjamin kode dimana depan, sedangkan tanpa testing kita akan menulis kode/fitur dengan cepat namun dimasa depan akan mememukan banyak masalah.

Dalam tulisan ini akan membuat project CRUD waifu sederhana. Waifu adalah favorite karakter di dalam anime.
Mari kita mulai.

## Setup Projek Rails

```shell
$> rails new waifu-tes -T
```

Rails secara default memakai minitest. Namun pada project ini kita akan menggunakan rspec dan capybara, maka kita meggunakan perintah -T untuk menginstal rails tanpa minitest.

Sekarang kita akan menambahkan rspec dan capybara pada project kita.

```ruby
# Gemfile
group :development, :test do
  # Call 'byebug' anywhere in the code to stop execution and get a debugger console
  gem 'byebug', platforms: [:mri, :mingw, :x64_mingw]
  gem 'rspec-rails'
  gem 'capybara'
end
```

Lalu install rspec dengan perintah `rails g rspec:install` , nanti rails akan menambahkan 3 file dan folder spec. Untuk menyambungkan capybara di rails test, anda perlu melakukan require pada file `spec/rails_helper.rb`.

```ruby
# spec/rails_helper.rb
# Add additional requires below this line. Rails is not loaded until this point!
require 'capybara/rails'
```

Anda telah selesai melakukan setup project.

## Pembuatan Fitur CRUD

TTD mempunyai level-level testingnya, antara lain: unit, model, controller dan integrasi.

RSpec digunakan di tinggkat unit, model hingga controller. Dan Capybara di integrasi atau based on feature.
Pada tulisan ini kita akan hanya membuat test integrasinya saja.

Kita akan memulainya membuat kode testnya terlebih dahulu, lalu membuat kodenya langsung, lalu test kode hingga test passed.

Buatlah file test, `spec/features/waifu_crud_spec.rb`.

```ruby
# spec/features/waifu_crud_spec.rb
require 'rails_helper'

describe 'Waifu crud', type: :feature do
  it 'waifu index' do
    visit '/'

    expect(page.title).to have_text('Waifu App')

    expect(page).to have_link('New Waifu', href: '/waifus/new')
  end
end
```

Kode diatas adalah murni dari RSpec, namun untuk metode visit , `have_text`, `have_link` dan variable page dari capybara.

Kode diatas sudah self explained jadi dirasa tidak perlu banyak penjelasan. Untuk referensi baik tentang rspec ata capybara bisa disini : [https://devhints.io/](https://devhints.io/)

Lalu jalankan kode test diatas dengan perintah rspec atau rake . Kode diatas akan error. Lalu benarkan error tersebut satu-persatu mengikuti pesannya. Dengan ini anda sudah menggunakan metodologi ttd dengan top-down pattern.

Setelah index telah dibuat, maka sekarang fitur untuk menambah waifu.

```ruby
# spec/features/waifu_crud_spec.rb
describe 'Waifu crud', type: :feature do
  # ...
  describe 'waifu add', type: feature do
    it 'add new waifu with valid attributes' do
      visit '/waifus/new'
      # check if field exists
      expect(page).to have_field('waifu[name]')

      # fill the waifu name
      fill_in 'waifu[name]', with: 'rem'

      click_on 'Tambahkan Waifu'

      expect(page).to have_content('rem')
    end
  end
end
```

Describe dalam describe? Sebenarnya hal yang menarik dalam menulis kode testing adalah bagaimana cara menulisnya dengan baik? hal tersebut sangat baik dipelajari setelah mengetahui dasar dari menulis test.

Tulisan ini hanya membahas dasarnya saja.

Silahkan jalankan rspec dan kembali membenarkannya.

Terakhir dalam edit dan delete.

```ruby
# spec/features/waifu_crud_spec.rb
describe 'Waifu crud', type: :feature do
  # ...
  describe 'waifu edit and destroy ' do
    before :each do
      @waifu = Waifu.create name: "emilia"
    end

    it 'edit waifu to hifumi' do
      visit edit_waifu_path(@waifu)

      fill_in 'waifu[name]', with: 'hifumi'

      click_on 'Edit Waifu'

      expect(page).to have_content('hifumi')
    end

    it 'delete waifu emilia' do
      visit '/'

      # check emilia is exists
      expect(page).to have_content('emilia')

      # delete emilia
      click_on 'Delete'

      expect(page).not_to have_content('emilia')
    end
  end
end
```

Pada ruby on rails database test dan development maupun produksi adalah berbeda, maka jika pada kode test memerlukan data, anda bisa membuat kodenya.

Agar kode lebih bersih saya menggunakan metode before :each yang prosedur didalamnya akan dieksesksi setiap test di dalam desckipsi yang bersangkutan.

Jalankan dan buat test tersebut pass :
```shell
$> rspec
....
Finished in 0.93712 seconds (files took 23.67 seconds to load)
4 examples, 0 failures
```

Setelah kode semua pass, maka artinya semua kode sudah berfungsi sesuai yang didefinisikan pada rancangan di kode `**_spec.rb`-nya.

Anda bisa melakukan refactoring, contohnya pada controller, yang kita menemukan kode yang sama untuk select waifu, seperti kode dibawah ini :

```ruby
# waifus_controller.rb
# ...
def edit
  @waifu = Waifu.find_by_id params[:id]
end

def update
  @waifu = Waifu.find_by_id params[:id]
  if @waifu.update_attributes(waifu_params)
    redirect_to root_path
  end
end

def destroy
  @waifu = Waifu.find_by_id params[:id]
  if @waifu.destroy
    redirect_to root_path
  end
end
# ...
```

Untuk solusi diatas, anda bisa melakukan seperti ini :

```ruby
class WaifusController < ApplicationController
  before_action :select_waifu, only: [:edit, :update, :destroy]
  # ...
```

Yaitu untuk mengeksekusi fungsi tertentu jika ada beberapa fungsi dieksekusi.

Setelah itu membuat fungsi select_waifu() nya.

```ruby
# ...
private
def waifu_params
  params.require(:waifu).permit(:name)
end

def select_waifu
  @waifu = Waifu.find_by_id params[:id]
end
#...
```

Maka kode duplikat yang tadi dapat dihapus, menjadi seperti ini:

```ruby
def edit
end

def update
  if @waifu.update_attributes(waifu_params)
    redirect_to root_path
  end
end

def destroy
  if @waifu.destroy
    redirect_to root_path
  end
end
```

Dengan ini anda telah menggunkan kosep DRY (Dont repeat yourself), yang membuat kode anda lebih rapih dan bersih.

Lalu jalankan kode test untuk memastikan fitur semua bekerja sama seperti di awalan refactoring.

```shell
$> rspec
....
Finished in 0.93712 seconds (files took 1.97 seconds to load)
4 examples, 0 failures
```

Dengan ini anda tidak perlu memastikan semua fitur telah bekerja, dengan membuka browser dan mengeksekusi masing-masing halaman yang akan melelahkan dan membosankan, sekarang anda bisa memastikannya secara automated.

## Beberapa Catatan
Sebelum mengakhiri tulisan ini, saya memberi catatan atau tips terkait testing.
Jika anda bekerja di produk yang besar, anda akan memiliki banyak kode test, dimana setiap kali anda mengeksekusi testnya akan ada kelambatan.

Kelembatan tersebut bisa karena, anda banyak menggunakan koneksi dengan database. Untuk solusi ini anda bisa menggunakan abstraksi database dengan factory_bot, dimana akan menambah performa testing lebih cepat.
Kelambatan yang terakhir adalah bisa karena file yang banyak.

Solusinya anda bisa mengeksekusi satu file saja yang terkait fitur yang sedang ada kerjakan contohnya seperti ini:

```shell
$> rspec ./spec/features/waifu_crud_spec.rb
.....
Finished in 0.93712 seconds (files took 1.97 seconds to load)
4 examples, 0 failures
```

----
Selamat anda telah menyelesaikan tulisannya.

Sebenarnya saya sendiri belum berpengalaman dalam testing, jadi mungkin masih banyak kekurangan dari tulisan ini, baik kodenya maupun konsepnya, namun semoga tulisan ini dapat membantu dan bermamfaat bagi pembaca sekalian, terima kasih.
