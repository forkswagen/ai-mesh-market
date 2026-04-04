soltoloka-backend-create-all-on-debug.patch — из корня monorepo:
  cd soltoloka-backend && git apply ../patches/soltoloka-backend-create-all-on-debug.patch
(или ручное слияние: в startup при DEBUG вызвать Base.metadata.create_all, см. app/main.py в форке.)
