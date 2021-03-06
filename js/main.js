let restaurants,
  neighborhoods,
  cuisines
var newMap
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap(); // added 
  updateRestaurants();
  fetchNeighborhoods();
  fetchCuisines();
  registerServiceWorker();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize leaflet map, called from HTML.
 */
initMap = () => {
  const map = document.getElementById('map');
  const noMapContainer = document.createElement('div');
  noMapContainer.setAttribute('class', 'no-map-container');

  const showMapBtn = document.createElement('a');
  showMapBtn.setAttribute('class', 'show-map-btn')
  showMapBtn.setAttribute('role', 'button');
  showMapBtn.setAttribute('aria-label', 'Click to restaurants on map');
  showMapBtn.setAttribute('href', '#');

  const div = document.createElement('div');
  div.setAttribute('style', 'padding-top: 15px; padding-bottom: 15px;');

  const loadingBar = document.createElement('span');
  loadingBar.setAttribute('class', 'fa fa-spinner fa-spin loading-map-bar');
  loadingBar.setAttribute('style', 'display: none');

  div.appendChild(loadingBar);

  const label = document.createElement('span');
  label.innerText = 'SHOW MAP'

  div.appendChild(label);

  showMapBtn.appendChild(div);

  noMapContainer.appendChild(showMapBtn);

  map.appendChild(noMapContainer);

  showMapBtn.addEventListener('click', () => {
    loadingBar.setAttribute('style', 'display: inherit');

    self.newMap = L.map('map', {
      center: [40.722216, -73.987501],
      zoom: 12,
      scrollWheelZoom: false
    });

    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
      mapboxToken: 'pk.eyJ1IjoiZGFoaGFtIiwiYSI6ImNqa2Y0aTEwNDA0eWwzdm56ZGl4cHZxYncifQ.pFJ9P_zH7VpiMJvRP4M4BQ',
      maxZoom: 18,
      attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      id: 'mapbox.streets'
    }).addTo(newMap);

    self.newMap.addEventListener('layeradd', function f() {
      map.removeChild(noMapContainer);
      self.newMap.removeEventListener('layeradd', f)
    })

    A11yHelper.putA11yToMap(self.newMap)
    addMarkersToMap();
  })

}
/* window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
} */

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  ul.setAttribute('role', 'list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });

}

onImageIntersectionListener = (images) => {
  images.forEach(image => {
    if (image.isIntersecting) {
      self.imageObserver.unobserve(image.target)
      const sources = image.target.querySelectorAll('.lazy-img')
      sources.forEach(source => {
        if (source.localName === 'img') {
          source.setAttribute('src', source.getAttribute('data-src'));
        } else if (source.localName === 'source') {
          source.setAttribute('srcset', source.getAttribute('data-srcset'));
        }
      })
    }
  })
}

calAvgRtn = (restaurant) => {

  DBHelper.fetchReviews(restaurant, reviews => {
    let avgRtn = 0;
    for (let review of reviews) {
      avgRtn = avgRtn + parseFloat(review.rating)
    }

    avgRtn = avgRtn / reviews.length

    let i = 0;
    for (i; i < avgRtn; i++) {
      const rate = document.getElementById(`restaurant-${restaurant.id}-rating-${i}`)
      rate.classList.replace('fa-star-o', 'fa-star')
    }

    if (avgRtn - i >= 0.5) {
      const rate = document.getElementById(`restaurant-${restaurant.id}-rating-${i}`)
      rate.classList.replace('fa-star-o', 'fa-star-half-o')
    }

    const averageRating = document.getElementById(`restaurant-${restaurant.id}-rating`);
    averageRating.setAttribute('aria-label', `average rating ${avgRtn}`);
  })
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');
  li.setAttribute('tabIndex', '0');
  li.setAttribute('aria-label', `${restaurant.name} restaurant ${restaurant.neighborhood}`);

  const image = document.createElement('img');
  image.alt = restaurant.name
  image.className = 'restaurant-img';

  const picture = document.createElement('picture');
  const source_large = document.createElement('source');
  source_large.setAttribute('class', 'lazy-img');
  source_large.setAttribute('media', '(min-width: 1600px)');

  const source_medium = document.createElement('source');
  source_medium.setAttribute('class', 'lazy-img');
  source_medium.setAttribute('media', '(min-width: 800px)');

  const source_small = document.createElement('source');
  source_small.setAttribute('class', 'lazy-img');
  source_small.setAttribute('media', '(max-width: 799px)')

  if ('IntersectionObserver' in window && !self.imageObserver) {
    image.dataset.src = DBHelper.imageUrlForRestaurant(restaurant);
    source_large.setAttribute('data-srcset', DBHelper.sourceUrlsForRestaurant(restaurant, 'large'));
    source_medium.setAttribute('data-srcset', DBHelper.sourceUrlsForRestaurant(restaurant, 'medium'));
    source_small.setAttribute('data-srcset', DBHelper.sourceUrlsForRestaurant(restaurant, 'small'));

    self.imageObserver = new IntersectionObserver(onImageIntersectionListener, {
      rootMargin: '50px 0px',
      threshold: 0.01
    })

    self.imageObserver.observe(picture)
  } else {
    image.src = DBHelper.imageUrlForRestaurant(restaurant);
    source_large.setAttribute('srcset', DBHelper.sourceUrlsForRestaurant(restaurant, 'large'));
    source_medium.setAttribute('srcset', DBHelper.sourceUrlsForRestaurant(restaurant, 'medium'));
    source_small.setAttribute('srcset', DBHelper.sourceUrlsForRestaurant(restaurant, 'small'));
  }

  picture.append(source_small);
  picture.append(source_large);
  picture.append(source_medium);

  picture.append(image)
  li.append(picture);

  const name = document.createElement('h3');
  name.innerHTML = restaurant.name;
  li.append(name);


  const averageRating = document.createElement('ul');
  averageRating.setAttribute('id', `restaurant-${restaurant.id}-rating`);
  averageRating.setAttribute('class', 'rating');
  averageRating.style.textAlign = 'center'
  averageRating.style.padding = 0
  for (let i = 0; i <= 5; i++) {
    const rate = document.createElement('li');
    rate.setAttribute('id', `restaurant-${restaurant.id}-rating-${i}`)
    rate.setAttribute('tabIndex', '-1')
    rate.setAttribute('class', 'fa fa-star-o rating-option')
    averageRating.appendChild(rate)
  }

  li.appendChild(averageRating)

  calAvgRtn(restaurant)

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.setAttribute('role', 'button');
  more.setAttribute('aria-label', `View more details on ${restaurant.name} restaurant.`);
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more)

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);

    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
  });
}
/* addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
} */


/**
 * @description Register service worker
 */
registerServiceWorker = () => {
  if (!navigator.serviceWorker) return;

  navigator.serviceWorker.register('sw.js').then(registration => {
    console.log('service worker registered successfully...!');

    if (registration.installing) {
      self.trackInstalling(registration.installing);
      //return;
    }

    if (registration.waiting) {
      self.trackWaiting(registration.waiting);
      //return;
    }

    self.addEventListener('updatefound', () => {
      trackInstalling(registration.installing);
    })

  }).catch(reason => {
    console.log('Failed to register service worker :', reason);
  })

  self.trackInstalling = (worker) => {
    worker.addEventListener('statechange', () => {
      if (worker.state == 'installed') {
        updateReady(worker);
      }
    })
  }

  self.trackWaiting = (worker) => {
    updateReady(worker);
  }

  self.updateReady = (worker) => {
    worker.postMessage({
      action: 'skipWaiting'
    })
  }
};