## 🖖PARN 🖖

It installs hex packages in the elixir app from http://hex.pm.

Name is taken from yarn nothing else 👅.

## INSTALLATION 

  `npm i -g parn` 
  or 
  `yarn global add parn`
  
## USAGE


##### Install Packages
`parn add ecto phoenix@latest mariaex@0.7.8 myapp@umbrella`

##### Remove Packages

`parn remove ecto phoenix`


##### Options

`<package_name>@<version>` - version can be `latest`, exact version like `1.22` and `umbrella` (for umbrella apps).


- `-O` - `{..., override: true}` *e.g `parn add phoenix@latest -O`*

- `-D` - `{..., only: :dev}`

- `-P` - `{..., only: :prod}`


# Screenshot

![](http://i.imgur.com/UI9exH9.png)


# Features
- Just works 
- Has Colors
# Caveats:
- It backups all modified version of `mix.exs` files in `./prod_exs/` because its just workaround and you may never know what it might break up. 
- It scraps data from hex.pm ( because i didnt find any proper api )
