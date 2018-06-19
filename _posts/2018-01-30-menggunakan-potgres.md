---
layout: post
title: Menggunakan PostgreSQL di Rails 5
date: 30-01-2018
image: postgres.jpg
tags: [postgres, rails, ruby, installation]
---

Web development dengan ruby on rails biasanya memakai postgres untuk databasenya pada produksi dibandingkan sqlite(default).

Tulisan ini akan membahas instalasi dan koneksinya ke rails. Rails membolehkan penggunaan perangkat lunak database yang berbeda di lingkungan berbeda, dimana rails mempunyai tiga lingkungan, development, test dan produksi.

Sebelumnya anda mungkin menggunakan database sqlite di development dan test, namun dalam produksi menggunakan postgres. Hal tersebut sangat tidak disarankan, karena memungkinkan ketika dalam pembuatan fitur, bekerja pada development namun tidak bekerja saat produksi.

## Instalasi PostgreSQL
```shell
$> sudo apt-get update
$> sudo apt-get install postgresql postgresql-contrib
$> psql --version
psql (PostgreSQL) 9.5.10
```

Instalasi diatas adalah untuk linux, jika os lain dapat dilihat disini.

Setelah instalasi telah berhasil, langkah selanjutnya adalah membuat role, atau koneksi pada postgresql.

```shell
# akses menggunakan super user
$> sudo su -

# masuk ke akun postgres
root@pc: ~#> sudo -i -u postgres

# jalankan buat user baru
postgres@pc: ~#> createuser pquest -s

# membuat database yang sama
postgres@pc: ~#> psql
psql > create database pquest;
CREATE DATABASE
```

Maka anda telah berhasil membuat akun role dengan nama pquest.
Option `-s` untuk super role.

## Pembuatan Projek Rails

Sekarang waktunya melakukan koneksi ke project railsnya.

```shell
$> rails new postgres-test -d postgresql
```

Pada file config/database.yml silahkan uncoment untuk usernya.

```yml
# config/database.yml
# ...
develepment:
  <<: *default
  database: postgres-test-development
```

Buat scaffold untuk coba-coba.

```shell
$> rails g scaffold anime name
$> rails db:migrate
```

Silahkan lihat hasil di url : [http://localhost:4000/animes](http://localhost:4000/animes)

----

Jika ingin lebih lanjut silahkan baca buku [ini](https://momjian.us/main/writings/pgsql/aw_pgsql_book/), atau dokumentasi postgresql-nya.

Terima kasih, anda telah menyelesaikan tulisan instalasi dan koneksi pemakaian postgresql di rails. Semoga dapat membantu.

