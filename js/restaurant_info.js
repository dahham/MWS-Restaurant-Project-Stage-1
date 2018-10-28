let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  init();
});

/**
 * Initialize leaflet map
 */
initMap = (restaurant) => {
  self.newMap = L.map('map', {
    center: [restaurant.latlng.lat, restaurant.latlng.lng],
    zoom: 16,
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
  A11yHelper.putA11yToMap(self.newMap);
}


init = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      //initMap(restaurant);
      fillBreadcrumb();
      //DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
      initRating()
    }
  });
}

/* window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} */

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {

      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;
  name.setAttribute('tabIndex', '0');
  name.setAttribute('aria-label', `Restaurant name, ${restaurant.name}`)

  self.address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;
  address.setAttribute('tabIndex', '0');
  address.setAttribute('aria-label', `Address ${restaurant.address}`);

  address.addEventListener('focus', focusevent => {
    hours.setAttribute('tabIndex', '0');
  })

  const source_large = document.getElementById('source-large');
  source_large.setAttribute('srcset', DBHelper.sourceUrlsForRestaurant(restaurant, 'large'));

  const source_medium = document.getElementById('source-medium');
  source_medium.setAttribute('srcset', DBHelper.sourceUrlsForRestaurant(restaurant, 'medium'));

  const source_small = document.getElementById('source-small');
  source_small.setAttribute('srcset', DBHelper.sourceUrlsForRestaurant(restaurant, 'small'));

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.setAttribute('alt', `image of ${restaurant.name} restaurant from ${restaurant.neighboorhood}`);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  if (!self.restaurant.reviews) {
    DBHelper.fetchReviews(self.restaurant, (reviews) => {
      self.restaurant.reviews = reviews;
      fillReviewsHTML();
    })
  } else {
    // fill reviews
    fillReviewsHTML();
  }
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  self.hours = document.getElementById('restaurant-hours');
  hours.setAttribute('tabIndex', '0');
  hours.setAttribute('aria-label', 'Operating hours')

  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    row.setAttribute('aria-label', `${key} ${operatingHours[key].replace('-', 'to').replace(',', ' and ')}`);

    hours.appendChild(row);

  }

  hours.addEventListener('focus', focusevent => {
    for (let child of hours.children) {
      child.setAttribute('tabIndex', '0');
    }

    ul.setAttribute('tabIndex', '0');
  })

  hours.firstChild.addEventListener('focus', focusevent => {
    hours.setAttribute('tabIndex', '-1');
  })
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {

  self.reviews_container = document.getElementById('reviews-container');

  self.reviews_details = document.getElementById('reviews-details')

  if (!reviews) {
    self.noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    self.reviews_details.appendChild(noReviews);
    return;
  } else if (self.noReviews) {
    self.reviews_details.removeChild(self.noReviews);
  }

  addReviews(...reviews);
}

addReviews = (...reviews) => {

  if (!self.ul) {
    self.ul = document.getElementById('reviews-list');
    ul.setAttribute('aria-label', 'Customers Reviews');
  }

  for (let review of reviews) {
    if (ul.children.length > 0) {
      ul.insertBefore(createReviewHTML(review), ul.firstChild)
    } else {
      ul.appendChild(createReviewHTML(review));
    }
  }

  ul.addEventListener('focus', focusevent => {

    for (let child of hours.children) {
      child.setAttribute('tabIndex', '-1');
    }

    hours.setAttribute('tabIndex', '0');
  })

  ul.firstChild.addEventListener('focus', focusevent => {
    ul.setAttribute('tabIndex', '-1');
  })

  if (!self.reviews_details.hasChildNodes) {
    self.reviews_details.appendChild(ul);
  }
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');

  const deleteIcon = document.createElement('span');
  deleteIcon.setAttribute('class', 'fontawesome-trash reviews-delete');

  deleteIcon.addEventListener('click', () => {
    DBHelper.removeReview(self.restaurant, review);
    self.ul.removeChild(li);
  })

  li.appendChild(deleteIcon);

  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = review.date || new Date(review.createdAt).toGMTString()
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  li.setAttribute('tabIndex', '0');
  li.setAttribute('aria-label', `Review from ${review.name} on ${review.date} with ${review.rating} rating. ${review.comments}`)

  return li;
}

toggleFavIcon = () => {
  const fav = document.getElementById('fav-icon');
  if (self.restaurant.is_favorite === "true" || self.restaurant.is_favorite === true) {
    fav.setAttribute('class', 'fontawesome-star')
  } else {
    fav.setAttribute('class', 'fontawesome-star-empty')
  }
}

favIconClickListener = () => {
  DBHelper.toggleFavorite(self.restaurant, new_restaurant => {

    if (new_restaurant != null) {
      self.restaurant = new_restaurant;
      toggleFavIcon(new_restaurant.is_favorite);
    }
  })
}
/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);

  const fav = document.createElement('li');
  fav.setAttribute('id', 'fav-icon');
  fav.setAttribute('style', 'float: right; font-size: 1.2em;');
  fav.setAttribute('class', 'fontawesome-star-empty');

  fav.addEventListener('click', favIconClickListener);

  breadcrumb.appendChild(fav)

  toggleFavIcon(restaurant.is_favorite)
}

initRating = (restaurant = self.restaurant) => {

  self.rating_form = new FormData()
  self.rating_form.append('restaurant_id', parseInt(restaurant.id, 10))

  ratingOnClickListener = (event) => {
    const target = event.currentTarget;
    self.rating_form.set('rating', parseInt(target.value, 10))


    for (let i = 5; i > 0; i--) {
      const ratingBtn = document.getElementById(`rating-star-${i}`)

      if (i <= target.value) {
        ratingBtn.classList.replace('fontawesome-star-empty', 'fontawesome-star')
      } else {
        ratingBtn.classList.replace('fontawesome-star', 'fontawesome-star-empty')
      }

    }
  };

  for (let i = 1; i <= 5; i++) {
    const ratingBtn = document.getElementById(`rating-star-${i}`)
    ratingBtn.addEventListener('click', ratingOnClickListener)
  }

  const submitBtn = document.getElementById('reviews-submit');
  submitBtn.addEventListener('click', () => {

    const rating_name = document.getElementById('rating-name');
    self.rating_form.set('name', rating_name.value);

    const rating_comment = document.getElementById('rating-comment');
    self.rating_form.set('comments', rating_comment.value);

    DBHelper.addReview(self.restaurant, self.rating_form, (review) => {
      if (review) {
        this.addReviews(review)
      }

    })

  })
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}