(function (global) {
  const CART_STORAGE_KEY = "ampmCart";
  const RETURN_STORAGE_KEY = "ampmCartReturnTo";

  const healthProductImageExt = {
    1: "png",
    2: "png",
    3: "png",
    4: "png",
    5: "png",
    6: "png",
    7: "jpg",
    8: "jpg",
    9: "jpg",
    10: "jpg",
    11: "jpg",
    12: "jpg",
    13: "jpg",
    14: "png",
    15: "jpg",
    16: "png",
    17: "jpg",
  };

  /** health.html / Figma health_wireframe 표시 상품명·할인가와 동일 */
  const healthProductCatalog = {
    1: {
      name: "종근당)눈건강 10정",
      price: 3000,
      originalPrice: 5000,
      discountRate: 40,
    },
    2: {
      name: "종근당)장건강 10정",
      price: 3000,
      originalPrice: 5000,
      discountRate: 40,
    },
    3: {
      name: "종근당)종합건강 10정",
      price: 3000,
      originalPrice: 3500,
      discountRate: 40,
    },
    4: {
      name: "종근당)다이어트 10정",
      price: 3000,
      originalPrice: 5000,
      discountRate: 40,
    },
    5: {
      name: "종근당)이너케어 10정",
      price: 3000,
      originalPrice: 5000,
      discountRate: 40,
    },
    6: {
      name: "종근당)혈행건강 10정",
      price: 3000,
      originalPrice: 5000,
      discountRate: 40,
    },
    7: { name: "대웅)임팩타임 에너지젤45g", price: 3000 },
    8: { name: "종건)아임비타 비타민젤리", price: 2800 },
    9: { name: "동아)육식파키위 효소3g", price: 2000 },
    10: { name: "NHC)그에너지 부스터20g", price: 3000 },
    11: { name: "CJ)하루한알비오틴구미", price: 3900 },
    12: { name: "종근당)혈행건강 10정", price: 5000 },
    13: { name: "동아)에너지 10정", price: 5000 },
    14: { name: "한미)텐텐맛멀티 비타민4입", price: 2500 },
    15: { name: "CJ)하루한알 비타민D아연", price: 3900 },
    16: { name: "RU21)비타민C6정", price: 5500 },
    17: { name: "동아)아일로카무트효소3g", price: 2000 },
  };

  function getHealthProductImageSrc(productNum) {
    const num = Number(productNum);
    const ext = healthProductImageExt[num];
    if (!ext) return null;
    const imageNum = num === 17 ? 5 : num;
    const padded = String(imageNum).padStart(2, "0");
    return `./design/product image/product image ${padded}.${ext}`;
  }

  function buildHealthProduct(productNum) {
    const meta = healthProductCatalog[Number(productNum)];
    if (!meta) return null;
    const img = getHealthProductImageSrc(productNum);
    return {
      id: `health-${productNum}`,
      name: meta.name,
      price: meta.price,
      originalPrice: meta.originalPrice,
      discountRate: meta.discountRate,
      img: img || "./assets/1.svg",
      category: "건강기능식품",
    };
  }

  function getItemLineTotal(item) {
    if (!item) return 0;
    return item.price * item.quantity;
  }

  function getOrderAmount(cartItems) {
    return cartItems.reduce((sum, item) => sum + getItemLineTotal(item), 0);
  }

  function adjustCartItemQuantity(item, delta) {
    if (!item) return { remove: true };
    const next = item.quantity + delta;
    if (next <= 0) return { remove: true };
    return { quantity: next };
  }

  function readCart() {
    try {
      const raw = global.sessionStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      const normalized = parsed.map((item) => {
        let next = { ...item };
        const healthMatch = String(item.id || "").match(/^health-(\d+)$/);
        if (healthMatch) {
          const product = buildHealthProduct(healthMatch[1]);
          if (product) {
            next.name = product.name;
            next.price = product.price;
            next.img = product.img;
            next.category = product.category;
          }
        }
        delete next.promotion;
        return next;
      });
      writeCart(normalized);
      return normalized;
    } catch {
      return [];
    }
  }

  function writeCart(cartItems) {
    global.sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }

  function getCartCount(cartItems) {
    return cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }

  function addHealthProduct(productNum) {
    const product = buildHealthProduct(productNum);
    if (!product) return readCart();

    const cartItems = readCart();
    const existing = cartItems.find((item) => item.id === product.id);

    if (existing) {
      existing.quantity += 1;
      existing.name = product.name;
      existing.price = product.price;
      existing.img = product.img;
    } else {
      cartItems.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        img: product.img,
        category: product.category,
      });
    }
    writeCart(cartItems);
    return cartItems;
  }

  function getHealthProductsMap() {
    const map = {};
    Object.keys(healthProductCatalog).forEach((num) => {
      const product = buildHealthProduct(num);
      if (product) map[product.id] = product;
    });
    return map;
  }

  function setCartReturnTo(url) {
    global.sessionStorage.setItem(RETURN_STORAGE_KEY, url);
  }

  function getCartReturnTo() {
    return global.sessionStorage.getItem(RETURN_STORAGE_KEY);
  }

  function clearCartReturnTo() {
    global.sessionStorage.removeItem(RETURN_STORAGE_KEY);
  }

  global.AmpmCart = {
    CART_STORAGE_KEY,
    RETURN_STORAGE_KEY,
    readCart,
    writeCart,
    getCartCount,
    getItemLineTotal,
    getOrderAmount,
    adjustCartItemQuantity,
    addHealthProduct,
    buildHealthProduct,
    getHealthProductImageSrc,
    getHealthProductsMap,
    setCartReturnTo,
    getCartReturnTo,
    clearCartReturnTo,
  };
})(window);
