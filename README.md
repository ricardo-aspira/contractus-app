# contractus-app: Sistema de gestão de contratos administrativos de Tecnologia da Informação

## POSTGRES

### PRIMEIRAS VEZ - CRIAÇÃO

-   docker run -d -p 5432:5432 --name contractusapp-postgres -e POSTGRES_PASSWORD=contractusapp postgres # apenas ambiente de teste, para produção, ao uma solução com Docker Compose deve ser provida para os dados serem persistidos em um diretório específico, com backup, etc

-   docker cp <contractus-app home>/setup/database/0.pre-DDL.sql contractusapp-postgres
-   docker cp <contractus-app home>/setup/database/1.DDL_contractusapp.sql contractusapp-postgres

-   docker exec -it contractusapp-postgres bash

    -   psql -U postgres
        -   \\i 0\.pre-DDL\.sql
        -   \\c contractusapp
        -   \\i 1.DDL_contractusapp\.sql
        -   exit
    -   exit

-   export POSTGRES_HOST=localhost;
-   export POSTGRES_PORT=5432;
-   export POSTGRES_DATABASE=contractusapp;
-   export POSTGRES_USER=postgres;
-   export POSTGRES_PASSWORD=contractusapp;

-   npm start

PS: Caso ao adicionar no servidor comece a receber problemas ao tentar adicionar servidor em 'localhost'. use o docker network inspect para pegar o IPv4 e conectar através dele

### DEPOIS - REUTILIZANDO O CONTAINER

-   docker start contractusapp-postgres
-   npm start

## PGADMIN

### PRIMEIRAS VEZ - CRIAÇÃO

-   docker run -d -p 5050:80 --name pgadmin -e PGADMIN_DEFAULT_EMAIL=pgadmin4@pgadmin.org -e PGADMIN_DEFAULT_PASSWORD=admin dpage/pgadmin4

### DEPOIS - REUTILIZANDO O CONTAINER

-   docker start pgadmin
