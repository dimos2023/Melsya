document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('nav');
  const filters = document.querySelectorAll('.filter-chips .pill');
  const cartCountEl = document.getElementById('cartCount');
  const addToCartButtons = document.querySelectorAll('.add-to-cart');
  const chatToggle = document.getElementById('chatToggle');
  const chatPanel = document.getElementById('chatPanel');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const chatMessages = document.getElementById('chatMessages');
  const OPENAI_API_KEY = window.OPENAI_API_KEY || localStorage.getItem('OPENAI_API_KEY') || '';
  const OPENAI_MODEL = 'gpt-3.5-turbo';

  const toggleNavShadow = () => {
    if (!nav) return;
    nav.classList.toggle('scrolled', window.scrollY > 12);
  };

  toggleNavShadow();
  window.addEventListener('scroll', toggleNavShadow);

  if (filters.length) {
    filters.forEach((pill) => {
      pill.addEventListener('click', () => {
        filters.forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
      });
    });
  }

  const getCart = () => {
    try {
      return JSON.parse(localStorage.getItem('cart')) || [];
    } catch (e) {
      return [];
    }
  };

  const setCart = (items) => {
    localStorage.setItem('cart', JSON.stringify(items));
    updateCartCount();
  };

  const updateCartCount = () => {
    if (!cartCountEl) return;
    const items = getCart();
    cartCountEl.textContent = items.length;
  };

  const handleAdd = (btn) => {
    const name = btn.dataset.name || 'منتج';
    const price = Number(btn.dataset.price || 0);
    const image = btn.dataset.image || '';
    const cart = getCart();
    cart.push({ name, price, image, qty: 1 });
    setCart(cart);
    btn.textContent = 'تمت الإضافة';
    setTimeout(() => { btn.textContent = 'أضف للسلة'; }, 1200);
  };

  if (addToCartButtons.length) {
    addToCartButtons.forEach((btn) => {
      btn.addEventListener('click', () => handleAdd(btn));
    });
  }

  updateCartCount();

  const addMessage = (text, me = false) => {
    if (!chatMessages) return;
    const div = document.createElement('div');
    div.className = me ? 'msg me' : 'msg';
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  };

  if (chatToggle && chatPanel) {
    chatToggle.addEventListener('click', () => {
      chatPanel.classList.toggle('open');
    });
  }

  if (chatForm && chatInput && chatMessages) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const value = chatInput.value.trim();
      if (!value) return;
      addMessage(value, true);
      chatInput.value = '';
      sendToGPT(value);
    });
  }

  const getPageContext = () => {
    const text = document.body.innerText || '';
    const compact = text.replace(/\s+/g, ' ').trim();
    return compact.slice(0, 1500);
  };

  const sendToGPT = async (userMessage) => {
    if (!OPENAI_API_KEY) {
      addMessage('الرجاء إضافة مفتاح OpenAI في المتصفح: localStorage.setItem("OPENAI_API_KEY","YOUR_KEY") ثم أعد المحاولة.');
      return;
    }
    addMessage('جارٍ كتابة الرد...', false);
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            {
              role: 'system',
              content: 'أنت مساعد دعم لمتجر ميلسه لأجهزة إزالة الشعر المنزلية. قدّم ردودًا قصيرة وواضحة باللهجة العربية المحلية، واشرح طرق الدفع والشحن والضمان. هذه مقتطفات من الصفحة: ' + getPageContext(),
            },
            { role: 'user', content: userMessage },
          ],
        }),
      });
      if (!res.ok) throw new Error('خطأ في الاتصال');
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || 'تعذّر الحصول على الرد الآن.';
      addMessage(reply, false);
    } catch (err) {
      addMessage('تعذّر الاتصال حالياً. تأكد من المفتاح والاتصال أو جرّب لاحقاً.', false);
    }
  };
});
