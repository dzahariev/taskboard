# taskboard
Web application for managing (create/modify/delete/start/stop) and monitoring (see progress) of generic tasks, that are handled by separate script or module. File system is used for persistency. 

- Backend build with Go, using [GorillaMux](https://github.com/gorilla/mux) for router and [GORM](https://gorm.io) for ORM data access
- Frontend based on [OpenUI5](https://openui5.hana.ondemand.com)
- Security is token based with [Keycloak](https://www.keycloak.org) Open ID provider

## Local environment

### Prerequisites 
Install: 
 - [docker](https://www.docker.com/products/docker-desktop/) 
 - [docker compose](https://docs.docker.com/compose/install/) 

Add to `/etc/hosts` line:
```
127.0.0.1 keycloak
``` 

### To start with different options (debug/no ui/no rebuild ui ...)
To start the application and a local Keycloak execute:
```
run.sh
```
To stop press Ctrl+C

For all available options see run.sh file.


### To start it with Docker compose

To start it using Docker compose execute:
```
docker-compose --env-file .env up --build
```

To stop it, execute:
```
docker-compose down
```

### Access to APIs

UI is on address: http://localhost:8800

Backend is on address: http://localhost:8800/api

Keycloak is on address: http://keycloak:8086/

Credentials for keycloak admin are `admin`/`admin`

Credentials for admin user inside taskboard realm `admin`/`admin`

Credentials for ordinary user inside taskboard realm `user`/`user`

To get token for ordinary user of taskboard realm:
```
curl --request POST \
  --url http://keycloak:8086/realms/taskboard/protocol/openid-connect/token \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data client_id=admin-cli \
  --data username=user \
  --data password=user \
  --data grant_type=password
  ```

To get token for admin user of taskboard realm:
```
curl --request POST \
  --url http://keycloak:8086/realms/taskboard/protocol/openid-connect/token \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data client_id=admin-cli \
  --data username=admin \
  --data password=admin \
  --data grant_type=password
```

To introspect a token:
```
curl --request POST \
  --url http://keycloak:8086/realms/taskboard/protocol/openid-connect/token/introspect \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data token=eyJhbGciOiJSUzI1NiI......uTf1CgOJ0KdNhuGmXgnLYw \
  --data client_id=taskboard-backend-client \
  --data client_secret=775df81b-170e-4900-8f2d-de46d801606d
```

## Update external libraries

### OPEN UI 5

Open UI 5 versions can be seen [here](https://openui5.hana.ondemand.com/versionoverview.html).

Update lubrary version by maintaining it inside `ui/ui5.yaml` file.

### Keycloak

Keycloak is an external dependency and JS library files needs to be updated when new version of Keycloak is adopted in `ui/package.json` file.

To Update keycloak-js library in UI module execute: 
```
update-keycloak-js.sh 
```

## Security

### Manage Realm

Create group `Realm Admins` with follwoing role mappings:

- `realm-management.view-users`
- `realm-management.manage-users`

Create dedicated user `realmadmin` and addi to `Realm Admins` group.
This user can manage (create/delete) users in this realm using the management console: http://keycloak:8086/admin/taskboard/console

This user is responsible to add/remove users from this realm.

> **_NOTE:_** The user that manages realm, cannot be used to work with applicaiton itself, due to bug with token encoding in Keycloak. This may change in the future. 

### Manage Applicaiton roles

Roles are defined in `Realm roles` with names `<resource>.<permission>` where resource is the name of your resource (url friendly) and permission is one of `read` or `write`. 

Example `task.read`, `task.write` ...

Roles are assigned to `Groups` or directly to users. Prefered way is to have groups like `Users`, `Admins`, `Auditors` ... 

Define a default Group that will be assigned to all newly registered users in `Realm settings/User registration/Default groups` - usually this should be the `Users` group.

Allow user registration in this realm in `Realm settings/Login` - enable `User registration` option. 
