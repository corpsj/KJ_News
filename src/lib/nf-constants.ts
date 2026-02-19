// NF (News Factory) constants — Category mapping for article import

export const NF_CATEGORIES = ["행정", "복지", "문화", "경제", "안전", "정치", "사회", "스포츠", "오피니언"];

export const NF_CATEGORY_MAP: Record<string, string> = {
  행정: "society",
  복지: "society",
  문화: "culture",
  경제: "economy",
  안전: "society",
  기타: "society",
  정치: "politics",
  사회: "society",
  스포츠: "sports",
  오피니언: "opinion",
};
