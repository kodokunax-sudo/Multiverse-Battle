// ========== ИЗОБРАЖЕНИЯ КАРТ В BASE64 ==========
const cardImages = {
    "Семёрка": "",
    "": "", 
    "": "", 
};

// Заглушка, если для карточки нет изображения
function getCardImage(cardName) {
    if (cardImages[cardName]) {
        return cardImages[cardName];
    }
    return null;
}