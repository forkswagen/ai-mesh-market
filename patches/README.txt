soltoloka-backend-create-all-on-debug.patch — from monorepo root:
  cd soltoloka-backend && git apply ../patches/soltoloka-backend-create-all-on-debug.patch
(or manual merge: on DEBUG startup call Base.metadata.create_all, see app/main.py in fork.)
