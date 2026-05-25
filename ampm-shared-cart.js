(function (global) {
  const CART_STORAGE_KEY = "ampmCart";
  const RETURN_STORAGE_KEY = "ampmCartReturnTo";

  const healthProductImageExt = {
    1: "jpg",
    2: "png",
    3: "jpg",
    4: "jpg",
    5: "jpg",
    6: "jpg",
    7: "jpg",
    8: "png",
    9: "jpg",
    10: "jpg",
    11: "jpg",
    13: "jpg",
    14: "png",
    15: "jpg",
    16: "png",
  };

  /** health.html 표시 상품명과 동일 (줄바꿈은 공백으로 통일) */
  const healthProductCatalog = {
    1: { name: "동아)눈호강 10정", price: 5000 },
    2: { name: "종근당)장건강 10정 1+1", price: 5000, promotion: "bogo-1-1" },
    3: { name: "대웅)임팩타임 에너지젤45g 2+1", price: 3500, promotion: "bogo-2-1" },
    4: { name: "종건)아임비타 비타민젤리", price: 2800 },
    5: { name: "동아)아일로카무트 효소3g", price: 1500 },
    6: { name: "종근당)아미코어 프로틴샷", price: 4500 },
    7: { name: "동아)혈행의 선순환10정", price: 5000 },
    8: { name: "종근당)이너케어 10정", price: 5000 },
    9: { name: "동아)육식파키위 효소3g", price: 2000 },
    10: { name: "NHC)그에너지 부스터20g", price: 3000 },
    11: { name: "CJ)하루한알비오틴구미", price: 3900 },
    12: { name: "종근당)혈행건강 10정", price: 5000 },
    13: { name: "동아)에너지 10정", price: 5000 },
    14: { name: "한미)텐텐맛멀티 비타민4입", price: 2500 },
    15: { name: "CJ)하루한알 비타민D아연", price: 3900 },
    16: { name: "RU21)비타민C6정", price: 5500 },
  };

  function getHealthProductImageSrc(productNum) {
    const ext = healthProductImageExt[Number(productNum)];
    if (!ext) return null;
    const padded = String(productNum).padStart(2, "0");
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
      img: img || "./assets/1.svg",
      category: "건강기능식품",
      promotion: meta.promotion || null,
    };
  }

  /** 1+1: 수량 2·4·6… / 2세트당 5,000원 */
  function getBogo11LineTotal(quantity) {
    return (quantity / 2) * 5000;
  }

  /** 2+1: 담기 시 1개. 수량 2→3 스냅. 4·7개 등 가능. 유료 = 수량 - floor(수량/3) */
  function normalizeBogo21Quantity(quantity) {
    let q = Math.max(1, Math.floor(quantity));
    if (q >= 2 && q % 3 === 2) q += 1;
    return q;
  }

  function getBogo21PaidUnits(quantity) {
    const q = normalizeBogo21Quantity(quantity);
    return q - Math.floor(q / 3);
  }

  function getBogo21LineTotal(quantity) {
    return getBogo21PaidUnits(quantity) * 3500;
  }

  function adjustBogo21Quantity(current, delta) {
    if (delta > 0) {
      let next = current + 1;
      if (next >= 2 && next % 3 === 2) next += 1;
      return { quantity: next };
    }
    let next = current - 1;
    if (next <= 0) return { remove: true };
    if (next >= 2 && next % 3 === 2) next -= 1;
    return { quantity: next };
  }

  function getItemLineTotal(item) {
    if (!item) return 0;
    if (item.promotion === "bogo-1-1") {
      return getBogo11LineTotal(item.quantity);
    }
    if (item.promotion === "bogo-2-1") {
      return getBogo21LineTotal(item.quantity);
    }
    return item.price * item.quantity;
  }

  function getOrderAmount(cartItems) {
    return cartItems.reduce((sum, item) => sum + getItemLineTotal(item), 0);
  }

  function getInitialPromotionQuantity(promotion) {
    if (promotion === "bogo-1-1") return 2;
    return 1;
  }

  function getAddPromotionDelta(promotion) {
    if (promotion === "bogo-1-1") return 2;
    return 1;
  }

  function adjustCartItemQuantity(item, delta) {
    if (!item) return { remove: true };

    if (item.promotion === "bogo-1-1") {
      const step = 2;
      const next = item.quantity + delta * step;
      if (next < 2) return { remove: true };
      return { quantity: next };
    }

    if (item.promotion === "bogo-2-1") {
      return adjustBogo21Quantity(item.quantity, delta);
    }

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
            next.promotion = product.promotion;
            next.img = product.img;
            next.category = product.category;
          }
        }
        if (next.promotion === "bogo-2-1") {
          next.quantity = normalizeBogo21Quantity(next.quantity);
        }
        if (next.promotion === "bogo-1-1" && next.quantity % 2 !== 0) {
          next.quantity = Math.max(2, Math.round(next.quantity / 2) * 2);
        }
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
    const initialQty = getInitialPromotionQuantity(product.promotion);
    const addDelta = getAddPromotionDelta(product.promotion);

    if (existing) {
      existing.quantity += addDelta;
      if (product.promotion === "bogo-2-1") {
        existing.quantity = normalizeBogo21Quantity(existing.quantity);
      }
    } else {
      cartItems.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: product.promotion ? initialQty : 1,
        img: product.img,
        category: product.category,
        promotion: product.promotion,
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
    getHealthProductsMap,
    setCartReturnTo,
    getCartReturnTo,
    clearCartReturnTo,
  };
})(window);
