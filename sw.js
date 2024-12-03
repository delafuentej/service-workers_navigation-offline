
//app shell => all that is needed for the application in order to work(need for quick loading)
// save app shell in cache storage

//const CACHE_NAME = 'cache-1';

const CACHE_STATIC_NAME='static-v5';
const CACHE_DYNAMIC_NAME='dynamic-v1';
const CACHE_INMUTABLE_NAME='inmutable-v1';
const CACHE_DYNAMIC_LIMIT = 25;



function cleanCache(cacheName, numItems){

    caches.open(cacheName)
            .then( cache => {
                //to get a records of all items in the cache
              return  cache.keys()
                    .then( keys => {
                       if(keys.length > numItems){
                        cache.delete(keys[0])
                            .then( cleanCache (cacheName, numItems));
                       }
                    });
            });
}

self.addEventListener('install', event => {
    
    //open cache
    const cachePromise = caches.open(CACHE_STATIC_NAME)
    .then( cache => {

       return cache.addAll([
        //app shell files:
            '/',
            '/index.html',
            '/css/style.css',
            '/img/main.jpg', 
            '/img/no-img.jpg',
            '/pages/offline.html',
            '/js/app.js'

        ]);
    });

    const cacheInmutable =  caches.open(CACHE_INMUTABLE_NAME)
                            .then( cache => {
                                return cache.addAll([
                                    'https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css'
                                ]);

                            });


    // wait until the promise is resolved in full 
    event.waitUntil(Promise.all([cachePromise, cacheInmutable]));

})

//to delete old cache versions when the new service worker is activated
self.addEventListener('activate', event => {
     // check if another cache type exists with the name static
    const deleteOldCache = caches.keys().then( keys => {
        keys.forEach( key => {
            if(key !== CACHE_STATIC_NAME && key.includes('static')){
                return caches.delete(key);
            }
        })
    })


    event.waitUntil(deleteOldCache);
})



       
  self.addEventListener('fetch', event => {


         //! 2-Strategy: "Cache with Network Fallback  (then cache)"=> first try to find the files in the cache and if not found perform http request
        //! Case: if the file is not in the cache, and no internet connection is available, no request can be made. 
         const cachePromiseWithNetworkFallbackThenCache = caches.match(event.request)
    .then( res => {
        //first look in the cache for what is being requested
        if(res) return res;
        // if !res (if the resource does not exist in the cache)=> http reques
        
        //console.log('it does not exists', event.request.url);
        // if the file does not exist in the cache , request it on the web:
    
        return fetch( event.request)
                .then(newRes => {
                    caches.open(CACHE_DYNAMIC_NAME)
                            .then( cache => {
                                cache.put(event.request, newRes);
                                cleanCache(CACHE_DYNAMIC_NAME, 25);
                            })
                    return newRes.clone();
                }).catch(error =>{
                    //in case that a web page is requested
                    if(event.request.headers.get('accept').includes('text/html')){
                        return caches.match('/pages/offline.html');
                    }
                   
                })
    });

    event.respondWith( cachePromiseWithNetworkFallbackThenCache);     
    




  })     
       
       
      