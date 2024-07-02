const LOCAL_STORAGE_WISHLIST_KEY = "shopify-wishlist";
const LOCAL_STORAGE_DELIMITER = ",";
const BUTTON_ACTIVE_CLASS = "active";
const GRID_LOADED_CLASS = "loaded";

let wishlistCounts = {
  initial: 0,
  current: 0,
};

const selectors = {
  button: "[button-wishlist]",
  grid: "[grid-wishlist]",
  productCard: ".product-card",
   wishlistIcon: ".desktop-wishlist-icon", 
};

document.addEventListener("DOMContentLoaded", () => {
  initButtons();
  initGrid();

 
  wishlistCounts.initial = getWishlist().length;
  console.log("Initial wishlist count:", wishlistCounts.initial);

  // Display initial count in the span with the class "wishlist-text"
  updateWishlistCountAfterElement(wishlistCounts.initial);
  // updateWishlistCountSpan(wishlistCounts.initial);

});

document.addEventListener("shopify-wishlist:updated", (event) => {
  console.log("[Shopify Wishlist] Wishlist Updated ✅", event.detail.wishlist);


  wishlistCounts.current = event.detail.wishlist.length;
  updateWishlistCountAfterElement(wishlistCounts.current);
  console.log("Current wishlist count:", wishlistCounts.current);
  
  // let text = "Your wishlist updated. Click OK to view wishlist";
  
  // if (text) {
  //     window.open("/pages/wishlist");
  //   }
    
    initGrid();
});

document.addEventListener("shopify-wishlist:init-product-grid", (event) => {
  console.log(
    "[Shopify Wishlist] Wishlist Product List Loaded ✅",
    event.detail.wishlist
  );
});

document.addEventListener("shopify-wishlist:init-buttons", (event) => {
  console.log(
    "[Shopify Wishlist] Wishlist Buttons Loaded ✅",
    event.detail.wishlist
  );

});

function newData(e){
  const parent = e.target.closest('.jev-wishlist-featured-image')
  parent.remove();
}

const fetchProductCardHTML = (handle) => {
  const productTileTemplateUrl = `/products/${handle}`;
  
  return fetch(productTileTemplateUrl)
    .then((res) => res.text())
    .then((res) => {
      // console.log("hello", res);
      
      const text = res;
      const parser = new DOMParser();
      const htmlDocument = parser.parseFromString(text, "text/html");
      const productCard = htmlDocument.querySelector(".product");
      console.log("productCard",productCard)

      let featured_image = productCard.querySelector('.product__media.media img')?.src
      let check_sale_price = productCard.querySelector('.price.price--on-sale')
      let sale_price = productCard.querySelector('.price-container-main .price__sale .price-item--sale')?.innerText
      let sale_price_with_regular = productCard.querySelector('.price-container-main .price__sale .price-item.price-item--regular')?.innerText
      let regular_price = productCard.querySelector('.price-container-main .price__regular .price-item--regular')?.innerText != undefined ? productCard.querySelector('.price-container-main .price__regular .price-item--regular')?.innerText : ''

      let price = check_sale_price ? `<div class="jev-sale-prices">${sale_price}</div><div class="regular-price-with-sale">${sale_price_with_regular}</div>` : `<div class="jev-regular-price">${regular_price}</div>`;
      
      let title = productCard.querySelector('.product__title .product__title')
      // let wishlistbutton = productCard.querySelector('.wish-list')

      // wishlistbutton.querySelector('button').setAttribute('onclick','newData(event)')
      const template = `
      
        <div class="jev-wishlist-featured-image">
          <a class="wishlist-product-link" href="/products/${handle}">
            <img src="${featured_image}" class="img-responsive" />
            <h2 class="jev-wishlist-product-title">${title.innerText}</h2>
            <div class="jev-wishlist-product-price">${price}</div>
          </a>
          
        </div>
      `;

      return template;
    })
    .catch((err) => {
      console.log('err', err)
      console.error(`[Shopify Wishlist] Failed to load content for handle: ${handle}`);
    });
};

const setupGrid = async (grid) => {
  const wishlist = getWishlist();
  const requests = wishlist.map(fetchProductCardHTML);
  const responses = await Promise.all(requests);
  const wishlistProductCards = responses.join("");
  grid.innerHTML = wishlistProductCards;
  grid.classList.add(GRID_LOADED_CLASS);
  initButtons();

  const event = new CustomEvent("shopify-wishlist:init-product-grid", {
    detail: { wishlist: wishlist },
  });
  document.dispatchEvent(event);
};

const setupButtons = (buttons) => {
  buttons.forEach((button) => {
    const productHandle = button.dataset.productHandle || false;
    if (!productHandle)
      return console.error(
        "[Shopify Wishlist] Missing `data-product-handle` attribute. Failed to update the wishlist."
      );
    if (wishlistContains(productHandle))
      button.classList.add(BUTTON_ACTIVE_CLASS);
    button.addEventListener("click", () => {
      updateWishlist(productHandle);
      button.classList.toggle(BUTTON_ACTIVE_CLASS);
    });
  });
};

const initGrid = () => {
  const grid = document.querySelector(selectors.grid) || false;
  if (grid) setupGrid(grid);
};

const initButtons = () => {
  const buttons = document.querySelectorAll(selectors.button) || [];
  console.log('Hello ', buttons)
  if (buttons.length) setupButtons(buttons);
  else return;
  const event = new CustomEvent("shopify-wishlist:init-buttons", {
    detail: { wishlist: getWishlist() },
  });
  document.dispatchEvent(event);
};

const getWishlist = () => {
  const wishlist = localStorage.getItem(LOCAL_STORAGE_WISHLIST_KEY) || false;
  if (wishlist) return wishlist.split(LOCAL_STORAGE_DELIMITER);
  return [];
};

const setWishlist = (array) => {
  const wishlist = array.join(LOCAL_STORAGE_DELIMITER);
  if (array.length) localStorage.setItem(LOCAL_STORAGE_WISHLIST_KEY, wishlist);
  else localStorage.removeItem(LOCAL_STORAGE_WISHLIST_KEY);

  const event = new CustomEvent("shopify-wishlist:updated", {
    detail: { wishlist: array },
  });
  document.dispatchEvent(event);

  return wishlist;
};

const updateWishlist = (handle) => {
  const wishlist = getWishlist();
  const indexInWishlist = wishlist.indexOf(handle);
  if (indexInWishlist === -1) wishlist.push(handle);
  else wishlist.splice(indexInWishlist, 1);
  return setWishlist(wishlist);
};

const wishlistContains = (handle) => {
  const wishlist = getWishlist();
  return wishlist.includes(handle);
};

const resetWishlist = () => {
  return setWishlist([]);
};

// Function to update the wishlist count in wishlisticon
const updateWishlistCountAfterElement = (count) => {
  const wishlistIcon = document.querySelector(selectors.wishlistIcon);
  if (wishlistIcon) {
    wishlistIcon.setAttribute('data-wishlist-count', count);
  }
};


// const updateWishlistCountSpan = (count) => {
//   const wishlistTextSpan = document.querySelector(".wishlist-text");
//   if (wishlistTextSpan) {
//     wishlistTextSpan.innerHTML = count;
//   }
// };