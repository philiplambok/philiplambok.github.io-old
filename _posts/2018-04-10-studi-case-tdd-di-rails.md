---
layout: post
title: Studi Case TDD di Rails
date: 10-04-2018
image: ruby-chara.jpg
tags: [rails, testing, rspec, capybara]
---

Pada tulisan sebelumnya [Pengenalan TDD dengan RSpec dan Capybara](https://philiplambok.github.io/2018/01/29/pengenalan-tdd.html) kita sempat membahas pengenalan RSpec dan capybara, di tulisan ini kita akan mencoba studi kasusnya.

Tulisan sebelumnya, kita hanya membahas instalasi dan pengenalan testing, namun belum sempat membahas bagaimana menulis testingnya. Tulisan ini akan mencoba membahasnya, point-pointnya antara lain :

- Setting konfigurasi generator.
- Menulis kode test untuk model
- Menulis kode test untuk *request*
- Menulis kode test untuk fitur.

Referensi yang dipakai dalam menulis ini adalah buku [everyday rails testing with rspec](https://leanpub.com/everydayrailsrspec). Silahkan baca bukunya, untuk informasi yang lebih detail.

## Setting konfigurasi generator
Paket atau framework yang dipakai pada tulisan ini adalah, RSpec dan Capybara. Silahkan cek dokumentasi atau tulisan sebelumnya untuk instalasi.

Jika anda sebelumnya sudah mencoba testing framework tesebut, maka setiap anda menggunakan *generator* anda akan disajikan file-file testing yang mungkin anda tidak pakai. Pada referensi yang diatas, pada testing di rails, minimum anda hanya perlu melakukan testing pada model, request dan fitur.

Model adalah unit testing, request adalah functional testing dan fitur adalah integration testing. Bagaimana dengan controller? controller testing sudah *soft deprecated* atau kadalwarsa diganti dengan request testing.

Pada tulisan ini kita akan membuat studi kasus untuk mengimplementasikan konsep-konsep testingnya, namun tulisan ini akan dibuat sederhana karena kita akan menggunakan *scaffold* saja. Projek yang akan dibuat adalah *waifu list*.

Silahkan instal terlebih dahulu, jika sudah maka kita akan setting generatornya di file `config/application.rb`.

```rb
config.generators do |g|
  g.text_framework :rspec,
    view_specs: false,
    helper_specs: false,
    controller_specs: false,
    routing_specs: false
end
```

Kita akan set rspec sebagai default testing frameworknya dan melakukan *disable* pembuatan file testing pada view, helper, controller dan routing test. Namun jika program sudah besar, mungkin beberapa testing akan dipakai, namun untuk saat ini testing tersebut belum diperlukan.

Sekarang waktunya untuk membuat scaffold. Jalankan perintah ini di terminal.

```bash
$> rails g scaffold waifus name
```

Maka fitur telah selesai, anda bisa routing ke `/waifus` untuk melihat hasilnya.

Sekedar tips, untuk mempercepat test kita akan menggunakan *spring*. Cukup tambahkan saja Gemfile-nya maka spring akan berjalan di background.

```rb
# use spring
gem 'spring-commands-rspec'
```

Untuk menggunakan spring, anda perlu menjalankan rpsec lewat bin.

```bash
$> bin/rspec
```

Sekedar tips lagi, disini saya akan menggunakan *factory bot* dibandingkan *factories* bawaan default rails. Namun *fatory bot* tidak cakupan tulisan ini. *Factory bot* pemakaiannya lebih flexible, akan dibahas di lain waktu.

Untuk saat ini silahkan instal lewat [dokumentasinya](https://github.com/thoughtbot/factory_bot).

## Menulis kode model untuk test

Pada model testing kita akan melakukan test berdasarkan model-nya. Waifu adalah karakter favorit pada anime, pada projek ini Ia hanya memiliki satu atribut yaitu nama. Maka kita akan test namanya, serta validasinya.

Sebelum menulis kode test mari membuat fixturesnya. Buat file `spec/factories/waifus.rb`.

```rb
FactoryBot.define do
  factory :waifu do
    id 1
    name "Rem"
  end
end
```

Maka, sekarang kita bisa membuat kode test-nya.

```rb
require 'rails_helper'

RSpec.describe Waifu, type: :model do
  it "is valid attributes" do
    waifu = build(:waifu)
    waifu.valid?
    expect(waifu.errors).to be_empty
  end

  it "is invalid without name" do
    waifu = build(:waifu, name: nil)
    waifu.valid?
    expect(waifu.errors[:name]).to include("can't be blank")
  end
end
```

Dalam menulis deskripsi testing, akan lebih baik lagi jika singkat dan jelas. Untuk referensi anda bisa membaca best practice-nya [disini](http://www.betterspecs.org/).


## Menulis kode test untuk request

Request testing ada untuk menggantikan controller testing yang sudah kadalwarsa. Request testing akan mengetes file controller, maka daripada itu kita dapat membuatnya seperti ini.

```rb
require 'rails_helper'

RSpec.describe "Waifus", type: :request do
  describe "GET /waifus" do
    it "works! (now write some real specs)" do
      get waifus_path
      expect(response).to have_http_status(200)
    end
  end

  describe "POST /waifus" do
    context "create new waifu" do
      it "valid attributes" do
        waifu_params = attributes_for(:waifu)
        expect {
          post waifus_path, params: { waifu: waifu_params }
        }.to change(Waifu, :count)
      end

      it "invalid without name" do
        waifu_params = attributes_for(:waifu, name: nil)
        expect {
          post waifus_path, params: { waifu: waifu_params }
        }.to_not change(Waifu, :count)
      end
    end
  end
end
```

Kita dapat menggunakan conteks untuk memisahkan fungsionalnya, dan it untuk yang lebih spesifiknya.

## Menulis kode fitur
Terakhir, adalah menulis integration testingnya. Feature testing sering disebut testing integrasi, karena *based on feature*. Pada testing ini kita akan menggunakan capybara untuk bantuannya. Silahkan buat file `spec/features/waifus_spec.rb`.

```rb
require 'rails_helper'

RSpec.feature "Waifus", type: :feature do
  before :each do
    @waifu = build(:waifu)
  end

  scenario "user create new waifu" do
    visit new_waifu_url

    expect {
      fill_in "Name", with: @waifu.name
      click_button "Create Waifu"

      expect(page).to have_content(@waifu.name)
    }.to change(Waifu, :count).by(1)

    expect(page.current_url).to eq(waifu_url(@waifu))
  end

  scenario "user show a waifu" do
    # create a waifu
    waifu = create(:waifu)

    # action
    visit waifus_path
    click_on "Show"

    # expection
    expect(page).to have_content(waifu.name)
    expect(page.current_url).to eq(waifu_url(waifu))
  end
end
```

Pada *feature testing* kita akan menggunakan `scenario` untuk mendeskripsikannya.

Untuk mengimplementasikan konsep TDD akan lebih baik workflownya yaitu dimulai dari membuat feature testing, lalu kode yang sebenarnya, lalu lakukan refactoring dan baru membuat kode test untuk model dan request-nya.

----
Terima kasih, anda baru saja telah selesai membaca tentang studi kasus penerapan TDD pada rails. TDD adalah metodologi yang wajib dikuasai saat ini, karena banyak kemamfaatan yang diberikannya untuk menulis kode yang mudah untuk di *maintance*, *clean* dan juga *scalable*.