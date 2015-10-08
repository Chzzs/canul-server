#Canul Server
#API Routes
Le serveur est disponible à l'adresse http://dev.canul.fr/, les routes sont:
  - [x] [POST]/api/authenticate
  - [x] [GET]/api/articles
  - [x] [GET]/api/artilces/:slug
  - [x] [PUT]/api/articles
  - [x] [DELETE]/api/articles
  - [x] [GET]/api/users
  - [ ] [GET]/api/users/:name
  - [ ] [PUT]/api/users
  - [ ] [DELETE]/api/users

#Authentification

Pour accéder aux différentes routes il faut s'authentifier et récupérer un token à l'adresse [POST]/api/authenticate et remplir le request.body (en spécifiant bien www-url-encoded) avec:
- name
- password

L'API renvoie alors une json array, si l'authentification réussie, un token y est contenu.
pour ensuite accéder au reste de l'API, il suffit de renseigner le token dans le request.headers.x-access-token


  
