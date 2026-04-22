# =============================================================
# app/services/advice_templates.py
# Offline bilingual (English + Nepali) fallback advice templates.
# Used when Gemini API is unavailable or rate-limited.
# =============================================================

# ── Crop Advice Templates (18 Nepal crops) ───────────────────

CROP_ADVICE_EN = {
    "rice": (
        "Your soil and climate conditions are well-suited for Rice (Dhan) cultivation. "
        "Rice thrives in waterlogged conditions typical of Nepal's Terai belt. "
        "Transplant paddy seedlings in June–July after pre-monsoon rains. "
        "Maintain 5–7 cm standing water during tillering. "
        "Apply Urea in three split doses: at transplanting, 30 days after, and at panicle initiation. "
        "Watch for blast disease and stem borer. Harvest when 80% of grains turn golden."
    ),
    "wheat": (
        "Your conditions favor Wheat (Gahun) cultivation. "
        "Wheat is Nepal's second most important cereal, widely grown in Terai and mid-hills. "
        "Sow in October–November for best yields. "
        "Irrigate at crown root initiation (21 DAS), tillering, jointing, and grain filling stages. "
        "Apply DAP at sowing and top-dress Urea at tillering. "
        "Control rust disease with fungicide spray. Harvest in March–April."
    ),
    "maize": (
        "Your soil and climate are suitable for Maize (Makai) cultivation. "
        "Maize is a key staple in Nepal's hills and Terai. "
        "Plant in March (spring) or June (monsoon). "
        "Ensure well-drained fertile loam soil. Avoid waterlogging. "
        "Apply NPK 20-20-20 at sowing and top-dress Urea twice. "
        "Control fall armyworm with timely pesticide application. "
        "Harvest at physiological maturity when husks turn brown."
    ),
    "potato": (
        "Your conditions are ideal for Potato (Aalu) cultivation. "
        "Nepal is a major potato producer in the mid-hills. "
        "Plant in September–October (main) or February (spring). "
        "Use certified seed tubers. Plant in ridges for good drainage. "
        "Apply DAP and MOP at planting. Top-dress Urea at earthing-up. "
        "Control late blight with Mancozeb or Ridomil fungicide. "
        "Harvest when tops die back, typically 90–120 days after planting."
    ),
    "mustard": (
        "Your soil and climate favor Mustard (Tori/Sarso) cultivation. "
        "Mustard is Nepal's main oilseed crop, widely grown in Terai winter. "
        "Sow in October–November after rice harvest. "
        "Requires minimal irrigation; one irrigation at flowering improves yield. "
        "Apply DAP at sowing. Use Urea as top-dressing at rosette stage. "
        "Spray insecticide for aphid control. Harvest when pods turn yellow-brown."
    ),
    "soybean": (
        "Your conditions are suitable for Soybean (Bhatmas) cultivation. "
        "Soybean is an important protein-rich crop in Nepal's Terai and inner valleys. "
        "Sow in June–July (kharif season). "
        "Inoculate seed with Rhizobium culture to fix atmospheric nitrogen. "
        "Apply MOP and DAP at sowing. Minimal nitrogen needed due to N-fixation. "
        "Ensure good drainage; soybean is sensitive to waterlogging. "
        "Harvest when 95% of pods turn yellow-brown."
    ),
    "jute": (
        "Your soil and climate are ideal for Jute (Jut) cultivation. "
        "Jute is a major cash crop in eastern Terai districts like Siraha, Saptari. "
        "Sow in April–May with onset of pre-monsoon rains. "
        "Needs heavy rainfall (1500–2000 mm) and warm temperatures. "
        "Apply Urea in two split doses. Thin plants to 10 cm spacing. "
        "Harvest when lower leaves start yellowing, at 100–120 days. "
        "Ret in water for 14–20 days to extract fiber."
    ),
    "lentil": (
        "Your conditions favor Lentil (Masuro) cultivation. "
        "Lentil is Nepal's most important pulse, widely grown in Terai and lower hills. "
        "Sow in November after rice/maize harvest. "
        "Drought-tolerant; one irrigation at pod-filling significantly improves yield. "
        "Apply DAP at sowing. Inoculate with Rhizobium for nitrogen fixation. "
        "Control collar rot with seed treatment. Harvest in March–April."
    ),
    "chickpea": (
        "Your soil is well-suited for Chickpea (Chana) cultivation. "
        "Chickpea is grown as a rabi crop in Nepal's Terai districts. "
        "Sow in October–November on residual moisture after rice. "
        "Avoid excess irrigation; chickpea is drought-tolerant. "
        "Apply DAP at sowing. Rhizobium inoculation reduces fertilizer need. "
        "Control Helicoverpa pod borer with timely spraying. Harvest in February–March."
    ),
    "blackgram": (
        "Your conditions are suitable for Black Gram (Maas) cultivation. "
        "Black gram is an important kharif pulse in Nepal's Terai. "
        "Sow in June–July. Short-duration crop (70–80 days). "
        "Ensure good drainage. Waterlogging causes root rot. "
        "Apply DAP at sowing. Minimal nitrogen needed (N-fixing crop). "
        "Control yellow mosaic virus by controlling whitefly vectors. "
        "Harvest in multiple pickings when pods mature."
    ),
    "mungbean": (
        "Your conditions favor Mung Bean (Moong) cultivation. "
        "Mung bean is a nutritious short-duration pulse grown in Nepal's Terai. "
        "Sow in March (spring) or June (monsoon). Matures in 60–65 days. "
        "Needs moderate moisture; avoid waterlogging. "
        "Apply DAP at sowing. Rhizobium inoculation is beneficial. "
        "Control powdery mildew with sulfur spray. "
        "Harvest when 70–80% of pods turn black."
    ),
    "pigeonpeas": (
        "Your conditions are suitable for Pigeon Peas (Rahar) cultivation. "
        "Pigeon peas are drought-tolerant and grow well in Nepal's inner Terai and mid-hills. "
        "Sow in May–June at the start of monsoon. "
        "Deep-rooted crop; tolerates dry periods. Avoid waterlogged areas. "
        "Apply DAP at sowing. Minimal nitrogen needed (N-fixing). "
        "Control pod fly and pod borer with neem-based pesticides. "
        "Harvest at 160–200 days when pods turn brown."
    ),
    "kidneybeans": (
        "Your conditions favor Kidney Bean (Simi/Rajma) cultivation. "
        "Kidney beans grow well in Nepal's mid-hills at 800–2000m elevation. "
        "Sow in March–April (spring) or June–July (summer). "
        "Monitor soil moisture at flowering; water stress reduces pod set. "
        "Apply NPK 20-20-20 at planting. Top-dress Urea at flowering. "
        "Control common bacterial blight with copper fungicides. "
        "Harvest when pods are fully filled and starting to dry."
    ),
    "banana": (
        "Your conditions are ideal for Banana (Kera) cultivation. "
        "Banana is widely grown in Nepal's Terai lowlands and lower mid-hills. "
        "Plant suckers year-round; best in February–March or August–September. "
        "Irrigate twice weekly in dry season. Mulch to retain moisture. "
        "Apply Urea, DAP, and MOP in monthly doses during growing season. "
        "Control Panama wilt (Fusarium) by using resistant varieties. "
        "Harvest bunches 11–14 months after planting when fingers fill out."
    ),
    "watermelon": (
        "Your conditions are suitable for Watermelon (Tarbuja) cultivation. "
        "Watermelon is widely grown in sandy loam soils of Nepal's Terai river banks. "
        "Sow seeds in February–March (spring season). "
        "Needs warm weather (25–35°C) and consistent moisture at fruiting. "
        "Apply NPK 20-20-20 at planting. Top-dress Urea at vine elongation. "
        "Control downy mildew with Mancozeb spray. Use mulch to retain moisture. "
        "Harvest 28–35 days after fruit set when the tendril nearest the fruit dries."
    ),
    "mango": (
        "Your conditions are suitable for Mango (Aam) cultivation. "
        "Mango is Nepal's most popular fruit, widely grown in Terai and lower mid-hills. "
        "Plant grafted saplings in July–August or February–March. "
        "Requires a cool dry period (15–20°C) for 2–3 months before flowering. "
        "Apply Compost and NPK 20-20-20 annually. Avoid nitrogen excess (reduces flowering). "
        "Control mango hopper and anthracnose with timely spraying. "
        "Harvest in May–July when skin color changes and aroma develops."
    ),
    "apple": (
        "Your conditions are ideal for Apple (Syau) cultivation. "
        "Apple is a high-value crop in Nepal's mid-hills above 1500m (Mustang, Jumla, Dolakha). "
        "Plant in February–March. Requires chilling hours below 7°C in winter. "
        "Apply Compost in October and NPK 20-20-20 in March. "
        "Ensure good drainage; apple roots are sensitive to waterlogging. "
        "Thin fruits to one per cluster for better size. "
        "Control scab and powdery mildew with fungicide schedule. "
        "Harvest in September–November based on variety."
    ),
    "orange": (
        "Your conditions favor Orange (Suntala) cultivation. "
        "Orange is a major horticultural crop in Nepal's mid-hills at 300–1500m. "
        "Plant in July–August (monsoon) or February–March. "
        "Requires well-drained slightly acidic soil (pH 6–7). "
        "Apply Compost annually and NPK 20-20-20 in split doses in March and August. "
        "Irrigate regularly; water stress during fruit development causes splitting. "
        "Control citrus canker with copper spray. Harvest November–January."
    ),
}

CROP_ADVICE_NP = {
    "rice": (
        "तपाईंको माटो र जलवायु धान खेतीका लागि उपयुक्त छ। "
        "धान तराईको जलभराव अवस्थामा राम्रोसँग हुर्किन्छ। "
        "असार–साउनमा मनसुन पूर्व वर्षापछि धानको रोपाइ गर्नुहोस्। "
        "कुशे जरा बाँध्ने अवस्थामा ५–७ सेमी पानी राख्नुहोस्। "
        "युरिया तीन किस्तामा दिनुहोस्: रोपाइमा, ३० दिनपछि, र बाला लाग्दा। "
        "ब्लास्ट रोग र डाँठ छेड्ने किराको नियन्त्रण गर्नुहोस्।"
    ),
    "wheat": (
        "तपाईंको अवस्था गहुँ खेतीका लागि अनुकूल छ। "
        "गहुँ नेपालको दोस्रो महत्वपूर्ण अन्नबाली हो। "
        "कात्तिक–मङ्सिरमा बीउ छर्नुहोस्। "
        "मूल जरा लाग्दा, कुशे जरा अवस्थामा, बाला लाग्दा सिँचाई गर्नुहोस्। "
        "बीउ छर्दा डीएपी र कुशे अवस्थामा युरिया प्रयोग गर्नुहोस्। "
        "रस्ट रोग नियन्त्रणका लागि ढुसीनाशक छर्कनुहोस्।"
    ),
    "maize": (
        "तपाईंको माटो र जलवायु मकै खेतीका लागि उपयुक्त छ। "
        "मकै नेपालका पहाड र तराईमा प्रमुख अन्नबाली हो। "
        "चैत (वसन्त) वा असारमा रोप्नुहोस्। "
        "जलभराव नहुने उर्वर दोमट माटो आवश्यक छ। "
        "बीउ रोप्दा एनपीके र दुई पटक युरिया टप–ड्रेस गर्नुहोस्।"
    ),
    "potato": (
        "तपाईंको अवस्था आलु खेतीका लागि उत्कृष्ट छ। "
        "नेपालका मध्यपहाडमा आलु मुख्य नगदे बाली हो। "
        "असोज–कात्तिक (मुख्य) वा फागुनमा रोप्नुहोस्। "
        "राम्रो पानी निकास हुने माटोमा डेउरी बनाएर रोप्नुहोस्। "
        "डीएपी र एमओपी रोप्दा दिनुहोस्, माटो चढाउँदा युरिया टप–ड्रेस गर्नुहोस्। "
        "ढुसी रोग (Blight) नियन्त्रणका लागि म्यान्कोजेब छर्कनुहोस्।"
    ),
    "mustard": (
        "तपाईंको माटो र जलवायु तोरी खेतीका लागि अनुकूल छ। "
        "तोरी नेपालको मुख्य तेलहन बाली हो, तराईमा जाडोमा उगाइन्छ। "
        "कात्तिक–मङ्सिरमा धान काटेपछि बीउ छर्नुहोस्। "
        "न्यूनतम सिँचाई चाहिन्छ; फूल लाग्दा एक पटक सिँचाई उत्पादन बढाउँछ। "
        "बीउ छर्दा डीएपी र रोजेट अवस्थामा युरिया टप–ड्रेस गर्नुहोस्।"
    ),
    "soybean": (
        "तपाईंको अवस्था भटमास खेतीका लागि उपयुक्त छ। "
        "भटमास तराई र भित्री उपत्यकाको प्रोटिनयुक्त बाली हो। "
        "असार–साउनमा खरिफ सिजनमा बीउ छर्नुहोस्। "
        "वायुमण्डलीय नाइट्रोजन बाँध्न राइजोबियम कल्चरले बीउ उपचार गर्नुहोस्। "
        "जलभराव नहुने ध्यान दिनुहोस्; भटमास जलभरावमा संवेदनशील छ।"
    ),
    "jute": (
        "तपाईंको माटो र जलवायु जुट खेतीका लागि उपयुक्त छ। "
        "जुट पूर्वी तराईका सिरहा, सप्तरी जिल्लाको मुख्य नगदे बाली हो। "
        "वैशाख–जेठमा मनसुन पूर्व वर्षापछि बीउ छर्नुहोस्। "
        "१५००–२००० मिमि वर्षा र न्यानो तापक्रम आवश्यक छ। "
        "युरिया दुई किस्तामा दिनुहोस्। बिरुवा १० सेमी दूरीमा पातलो गर्नुहोस्।"
    ),
    "lentil": (
        "तपाईंको अवस्था मसुरो खेतीका लागि अनुकूल छ। "
        "मसुरो नेपालको सबैभन्दा महत्वपूर्ण दलहन बाली हो। "
        "मङ्सिरमा धान/मकै काटेपछि बीउ छर्नुहोस्। "
        "खडेरी सहनशील; फली भर्दा एक सिँचाईले उत्पादन बढाउँछ। "
        "बीउ छर्दा डीएपी दिनुहोस्। राइजोबियम इनोकुलेसन लाभदायक हुन्छ।"
    ),
    "chickpea": (
        "तपाईंको माटो चना खेतीका लागि राम्रो छ। "
        "चना तराईका जिल्लामा रबी बाली हुन्छ। "
        "धान काटेपछि कात्तिक–मङ्सिरमा बाँकी सिँचाईमा बीउ छर्नुहोस्। "
        "अधिक सिँचाई नगर्नुहोस्; चना खडेरी सहनशील छ। "
        "बीउ छर्दा डीएपी दिनुहोस्। राइजोबियम इनोकुलेसन मलखाद खर्च घटाउँछ।"
    ),
    "blackgram": (
        "तपाईंको अवस्था माश खेतीका लागि उपयुक्त छ। "
        "माश तराईको महत्वपूर्ण खरिफ दलहन बाली हो। "
        "असार–साउनमा बीउ छर्नुहोस्। छोटो अवधि (७०–८० दिन) को बाली हो। "
        "राम्रो पानी निकास सुनिश्चित गर्नुहोस्। जलभरावले जरा कुहाउँछ। "
        "बीउ छर्दा डीएपी दिनुहोस्। नाइट्रोजन बाँध्ने बाली भएकाले थोरै N चाहिन्छ।"
    ),
    "mungbean": (
        "तपाईंको अवस्था मुङ बाली खेतीका लागि अनुकूल छ। "
        "मुङ तराईमा खेतिने पोषणयुक्त छोटो अवधिको दलहन बाली हो। "
        "चैत (वसन्त) वा असारमा बीउ छर्नुहोस्। ६०–६५ दिनमा पाक्छ। "
        "मध्यम सिँचाई चाहिन्छ; जलभराव नगर्नुहोस्। "
        "बीउ छर्दा डीएपी दिनुहोस्। सल्फर छर्केर धूलो ढुसी नियन्त्रण गर्नुहोस्।"
    ),
    "pigeonpeas": (
        "तपाईंको अवस्था रहर खेतीका लागि उपयुक्त छ। "
        "रहर भित्री तराई र मध्यपहाडमा खेतिने खडेरी सहनशील दलहन हो। "
        "जेठ–असारमा मनसुन सुरुमा बीउ छर्नुहोस्। "
        "गहिरो जरा भएकाले सुक्खा अवधि सहन सक्छ। जलभराव भएको ठाउँ नगर्नुहोस्। "
        "बीउ छर्दा डीएपी दिनुहोस्। नाइट्रोजन बाँध्ने बाली भएकाले N कम चाहिन्छ।"
    ),
    "kidneybeans": (
        "तपाईंको अवस्था राजमा/सिमी खेतीका लागि अनुकूल छ। "
        "राजमा नेपालका मध्यपहाडमा ८००–२०००मि उचाइमा राम्ररी हुन्छ। "
        "चैत–वैशाख (वसन्त) वा असार–साउनमा रोप्नुहोस्। "
        "फूल लाग्दा माटोको सिँचाई अनुगमन गर्नुहोस्; खडेरीले फली कम लाग्छ। "
        "रोप्दा एनपीके दिनुहोस्। फूल लाग्दा युरिया टप–ड्रेस गर्नुहोस्।"
    ),
    "banana": (
        "तपाईंको अवस्था केरा खेतीका लागि उत्कृष्ट छ। "
        "केरा तराई र निम्न मध्यपहाडमा व्यापक रूपमा खेतिन्छ। "
        "वर्षभर रोप्न मिल्छ; फागुन–चैत वा भदौ–असोज सबैभन्दा राम्रो। "
        "सुख्खा मौसममा हप्तामा दुई पटक सिँचाई गर्नुहोस्। "
        "बढ्दो सिजनमा मासिक युरिया, डीएपी र एमओपी दिनुहोस्।"
    ),
    "watermelon": (
        "तपाईंको अवस्था तरबुजा खेतीका लागि उपयुक्त छ। "
        "तरबुजा तराईका नदीकिनारका बालुवे दोमट माटोमा व्यापक रूपमा खेतिन्छ। "
        "फागुन–चैतमा बीउ छर्नुहोस्। "
        "न्यानो मौसम (२५–३५°C) र फलफूल्दा नियमित सिँचाई चाहिन्छ। "
        "रोप्दा एनपीके र लहरा पस्दा युरिया टप–ड्रेस गर्नुहोस्।"
    ),
    "mango": (
        "तपाईंको अवस्था आँप खेतीका लागि उपयुक्त छ। "
        "आँप नेपालको सबैभन्दा लोकप्रिय फलफूल हो, तराई र निम्न मध्यपहाडमा खेतिन्छ। "
        "साउन–भदौ वा फागुन–चैतमा कलम बिरुवा रोप्नुहोस्। "
        "फूल आउनु अघि २–३ महिना चिसो सुक्खा मौसम आवश्यक छ। "
        "वार्षिक कम्पोस्ट र एनपीके दिनुहोस्। अधिक नाइट्रोजन फूल लाग्न घटाउँछ।"
    ),
    "apple": (
        "तपाईंको अवस्था स्याउ खेतीका लागि उत्कृष्ट छ। "
        "स्याउ नेपालका १५०० मिभन्दा माथिका मध्यपहाडमा उच्च मूल्यको बाली हो (मुस्ताङ, जुम्ला, डोल्खा)। "
        "फागुन–चैतमा रोप्नुहोस्। जाडोमा ७°C भन्दा कम चिलिङ आवर चाहिन्छ। "
        "असोजमा कम्पोस्ट र चैतमा एनपीके दिनुहोस्। "
        "जलभराव नहुने सुनिश्चित गर्नुहोस्; स्याउको जरा जलभरावमा संवेदनशील छ।"
    ),
    "orange": (
        "तपाईंको अवस्था सुन्तला खेतीका लागि अनुकूल छ। "
        "सुन्तला नेपालका ३००–१५०० मिको मध्यपहाडमा प्रमुख बागवानी बाली हो। "
        "साउन–भदौ (मनसुन) वा फागुन–चैतमा रोप्नुहोस्। "
        "राम्रो पानी निकास हुने अम्लीय माटो (पीएच ६–७) आवश्यक छ। "
        "वार्षिक कम्पोस्ट र चैत र भदौमा किस्तामा एनपीके दिनुहोस्। "
        "फल विकासमा खडेरीले फल फुट्छ; नियमित सिँचाई गर्नुहोस्।"
    ),
}

# ── Fertilizer Advice Templates (5 Nepal fertilizers) ────────

FERTILIZER_ADVICE_EN = {
    "Urea": (
        "Urea (46% N) is recommended to correct nitrogen deficiency in your field. "
        "Apply 45–60 kg/ha split into 2–3 doses. "
        "First dose at sowing/transplanting, second at tillering/vegetative stage, "
        "third at panicle initiation/flowering. "
        "Apply to moist soil or incorporate immediately to prevent ammonia loss. "
        "Avoid applying before heavy rain to prevent runoff losses. "
        "Over-application causes excessive vegetative growth and susceptibility to lodging."
    ),
    "DAP": (
        "DAP (Di-Ammonium Phosphate, 18-46-0) is recommended to address both nitrogen "
        "and phosphorus deficiency in your field. "
        "Apply 50–100 kg/ha as a basal dose at sowing time. "
        "DAP is ideal for Terai soils where phosphorus fixation is high. "
        "Place below the seed (band application) for maximum phosphorus uptake efficiency. "
        "Combines well with Urea for top-dressing to supply nitrogen throughout the season. "
        "Store in a dry place; DAP is hygroscopic and can clump in humidity."
    ),
    "MOP": (
        "MOP (Muriate of Potash, 0-0-60) is recommended to correct potassium deficiency. "
        "Apply 40–60 kg/ha as basal dose at sowing or early tillering. "
        "Potassium improves crop quality, disease resistance, and water-use efficiency. "
        "For sandy soils, split MOP application to prevent leaching losses. "
        "Avoid applying together with DAP; use separately or in NPK blend. "
        "Particularly important for potatoes, bananas, and fruits where K drives quality."
    ),
    "NPK 20-20-20": (
        "NPK 20-20-20 balanced fertilizer is recommended for your soil which is deficient "
        "in all three major nutrients (N, P, K). "
        "Apply 100–150 kg/ha at sowing time. "
        "This balanced formula supports root development, vegetative growth, and grain/fruit filling. "
        "Suitable for vegetables, maize, potato, and cash crops. "
        "Follow up with Urea top-dressing during active growth for additional nitrogen. "
        "Available from AICL (Agricultural Inputs Company Limited) in Nepal."
    ),
    "Compost": (
        "Compost is recommended to improve your soil's organic matter and long-term fertility. "
        "Apply 5–10 tonnes/ha, well-decomposed, before sowing or during land preparation. "
        "Compost improves soil structure, water retention, and microbial activity. "
        "Particularly beneficial for soils with high clay or low organic matter content. "
        "Can be combined with chemical fertilizers to reduce total NPK application by 25–30%. "
        "Prepare compost from crop residues, animal manure, and kitchen waste using pit method. "
        "NARC recommends prioritizing organic amendments in mid-hills agriculture."
    ),
}

FERTILIZER_ADVICE_NP = {
    "Urea": (
        "तपाईंको खेतमा नाइट्रोजन कमीलाई सुधार गर्न युरिया (४६% N) सिफारिस गरिन्छ। "
        "४५–६० किग्रा/हेक्टर दुई–तीन किस्तामा प्रयोग गर्नुहोस्। "
        "पहिलो किस्ता रोपाइ/बीउ छर्दा, दोस्रो कुशे जरा/हरियो अवस्थामा, "
        "तेस्रो बाला लाग्दा/फूल लाग्दा। "
        "भिजेको माटोमा प्रयोग गर्नुहोस् वा तुरुन्त माटोमा मिलाउनुहोस्। "
        "ठूलो वर्षाअघि प्रयोग नगर्नुहोस्; बग्ने हानि हुन्छ।"
    ),
    "DAP": (
        "डीएपी (डाइ-अमोनियम फस्फेट, १८-४६-०) तपाईंको खेतमा नाइट्रोजन र "
        "फस्फोरस दुवैको कमी सुधार गर्न सिफारिस गरिन्छ। "
        "बीउ छर्दा/रोप्दा आधार मात्राको रूपमा ५०–१०० किग्रा/हेक्टर प्रयोग गर्नुहोस्। "
        "बीउ मुनि राखेर (ब्यान्ड एप्लिकेसन) फस्फोरस ग्रहण दक्षता बढाउनुहोस्। "
        "मौसमभर नाइट्रोजन आपूर्तिका लागि युरियासँग मिलाएर टप–ड्रेस गर्न सकिन्छ।"
    ),
    "MOP": (
        "एमओपी (म्युरेट अफ पोटाश, ०-०-६०) पोटासियम कमी सुधार गर्न सिफारिस गरिन्छ। "
        "बीउ छर्दा वा प्रारम्भिक कुशे जरा अवस्थामा ४०–६० किग्रा/हेक्टर आधार मात्रा दिनुहोस्। "
        "पोटासियमले बालीको गुणस्तर, रोग प्रतिरोधक क्षमता र पानी उपयोग दक्षता सुधार गर्छ। "
        "बालुवे माटोमा एमओपी किस्तामा दिनुहोस्; बग्ने हानि रोक्न। "
        "आलु, केरा र फलफूल बालीका लागि विशेष महत्वपूर्ण।"
    ),
    "NPK 20-20-20": (
        "एनपीके २०-२०-२० सन्तुलित मल तपाईंको माटोमा तिनवटै मुख्य पोषक तत्व "
        "(नाइट्रोजन, फस्फोरस, पोटासियम) को कमी भएकाले सिफारिस गरिन्छ। "
        "बीउ छर्दा/रोप्दा १००–१५० किग्रा/हेक्टर प्रयोग गर्नुहोस्। "
        "यो सन्तुलित सूत्रले जरा विकास, हरियो वृद्धि र दाना/फल भर्न सहयोग गर्छ। "
        "तरकारी, मकै, आलु र नगदे बालीका लागि उपयुक्त। "
        "नेपालमा कृषि सामग्री कम्पनी लिमिटेड (एआइसीएल) बाट उपलब्ध।"
    ),
    "Compost": (
        "कम्पोस्टले तपाईंको माटोको जैविक पदार्थ र दीर्घकालीन उर्वरता सुधार गर्न सिफारिस गरिन्छ। "
        "राम्ररी कुहेको ५–१० टन/हेक्टर बीउ छर्नुअघि वा जमिन तयार गर्दा प्रयोग गर्नुहोस्। "
        "कम्पोस्टले माटोको संरचना, पानी भण्डारण र सूक्ष्मजीव क्रियाकलाप सुधार गर्छ। "
        "रासायनिक मलसँग मिलाएर प्रयोग गर्दा एनपीके मात्र २५–३०% घटाउन सकिन्छ। "
        "बाली अवशेष, गोबर र रसोईको फोहोरबाट खाल्टो विधिले कम्पोस्ट बनाउनुहोस्।"
    ),
}

# ── Irrigation Advice Templates ───────────────────────────────

IRRIGATION_ADVICE_EN = {
    0: (
        "Your soil moisture level is adequate — no irrigation is needed at this time. "
        "Continue monitoring soil moisture every 2–3 days using the sensor. "
        "If rainfall is expected within 48 hours, skip irrigation to avoid waterlogging. "
        "Check for signs of poor drainage if readings remain consistently high."
    ),
    1: (
        "Moderate soil moisture deficit detected. Irrigation is recommended. "
        "Apply 10–15 mm of water within the next 2–3 days. "
        "Prefer early morning irrigation (5–8 AM) to reduce evaporation losses. "
        "For rice: maintain 3–5 cm standing water. "
        "For vegetables: use drip or furrow irrigation. Monitor after application."
    ),
    2: (
        "Significant soil moisture deficit. Irrigation is highly recommended. "
        "Apply 20–25 mm of water within the next 24 hours. "
        "Crops showing signs of mild wilting — act promptly. "
        "For maize/wheat: flood or sprinkler irrigation preferred. "
        "For fruits/vegetables: drip irrigation at 2× normal rate. "
        "Check irrigation system before starting and ensure uniform water distribution."
    ),
    3: (
        "Severe soil moisture deficit. Irrigation is urgently needed. "
        "Apply 30–35 mm of water today or tomorrow. "
        "Crop stress indicators likely visible — yellowing leaves, wilting. "
        "For all crops: irrigate immediately in the cool morning hours. "
        "Avoid overhead irrigation during heat of the day. "
        "After irrigation, check soil at 10 cm depth to confirm moisture penetration."
    ),
    4: (
        "Critical water stress! Immediate irrigation required. "
        "Apply 40–50 mm of water IMMEDIATELY. "
        "Crops in critical stress — irreversible damage possible within 24–48 hours. "
        "Prioritize water supply to the most sensitive growth stages (flowering, grain-fill). "
        "If water supply is limited, focus on most water-sensitive crops first. "
        "Contact local irrigation department if canal supply is insufficient."
    ),
}

IRRIGATION_ADVICE_NP = {
    0: (
        "तपाईंको माटोमा पर्याप्त सिँचाई छ — अहिले सिँचाईको आवश्यकता छैन। "
        "हरेक २–३ दिनमा माटोको आर्द्रता अनुगमन जारी राख्नुहोस्। "
        "४८ घण्टाभित्र वर्षाको सम्भावना छ भने सिँचाई नगर्नुहोस्। "
        "लगातार उच्च पाठ्यांक भए पानी निकास समस्या जाँच गर्नुहोस्।"
    ),
    1: (
        "मध्यम माटो आर्द्रता कमी पत्ता लाग्यो। सिँचाई सिफारिस गरिन्छ। "
        "आगामी २–३ दिनभित्र १०–१५ मिमि पानी दिनुहोस्। "
        "वाष्पीकरण घटाउन बिहान ५–८ बजे सिँचाई गर्नुहोस्। "
        "धानका लागि ३–५ सेमि पानी राख्नुहोस्। "
        "तरकारीका लागि थोपा वा नाली सिँचाई प्रयोग गर्नुहोस्।"
    ),
    2: (
        "महत्वपूर्ण माटो आर्द्रता कमी। सिँचाई अत्यन्त सिफारिस गरिन्छ। "
        "आगामी २४ घण्टाभित्र २०–२५ मिमि पानी दिनुहोस्। "
        "बालीमा हल्का ओइलाइको लक्षण देखिन सक्छ — तुरुन्त कदम चाल्नुहोस्। "
        "मकै/गहुँका लागि बाढी वा स्प्रिंक्लर सिँचाई उपयुक्त। "
        "फलफूल/तरकारीका लागि दोब्बर दरमा थोपा सिँचाई गर्नुहोस्।"
    ),
    3: (
        "गम्भीर माटो आर्द्रता कमी। तुरुन्त सिँचाई आवश्यक छ। "
        "आज वा भोलि ३०–३५ मिमि पानी दिनुहोस्। "
        "बालीमा तनावका लक्षण — पहेँलो पात, ओइलाइ देखिनसक्छ। "
        "सबै बालीलाई चिसो बिहानमा तुरुन्त सिँचाई गर्नुहोस्। "
        "दिउँसोको घामको बेला माथिबाट सिँचाई नगर्नुहोस्।"
    ),
    4: (
        "गम्भीर पानी तनाव! तुरुन्त सिँचाई गर्नुहोस्! "
        "तुरुन्त ४०–५० मिमि पानी दिनुहोस्। "
        "बालीमा गम्भीर तनाव — २४–४८ घण्टाभित्र अपूरणीय क्षति हुन सक्छ। "
        "फूल लाग्दा र दाना भर्दा पानीको प्राथमिकता दिनुहोस्। "
        "पानी आपूर्ति सीमित भए सबैभन्दा संवेदनशील बालीमा पहिले सिँचाई गर्नुहोस्। "
        "नहर आपूर्ति अपर्याप्त भए स्थानीय सिँचाई विभागमा सम्पर्क गर्नुहोस्।"
    ),
}

# ── Soil Fertility Advice Templates ──────────────────────────

SOIL_ADVICE_EN = {
    "Low": (
        "Your soil fertility is LOW. Immediate action needed to improve soil health. "
        "Apply 5–10 tonnes/ha of well-decomposed compost or farmyard manure before sowing. "
        "Use NPK 20-20-20 balanced fertilizer to address all macronutrient deficiencies. "
        "Consider green manuring with dhaincha (Sesbania) before the main crop. "
        "Conduct a detailed Soil Health Card test from local agriculture office (Krishi Karyalaya). "
        "Lime application (1–2 tonnes/ha) may be needed if soil pH is below 5.5. "
        "With proper management, fertility can improve from Low to Medium within one season."
    ),
    "Medium": (
        "Your soil fertility is MEDIUM — a good foundation for most crops. "
        "Maintain fertility with regular organic additions (2–3 tonnes/ha compost annually). "
        "Use targeted fertilization based on crop nutrient requirements. "
        "Rotate crops to prevent nutrient depletion: follow rice with legumes (lentil, chickpea). "
        "Apply DAP at sowing and top-dress with Urea during active growth. "
        "Avoid burning crop residues — incorporate them into soil to return organic matter. "
        "Annual Soil Health Card test recommended to track trends over seasons."
    ),
    "High": (
        "Your soil fertility is HIGH — excellent conditions for most crops. "
        "This is ideal for high-value crops like vegetables, fruits, and cash crops. "
        "Maintain fertility by returning crop residues and applying compost (2 tonnes/ha). "
        "Monitor for nutrient imbalances — high fertility can cause excess N or P buildup. "
        "Consider reducing chemical fertilizer doses by 20–25% given good baseline fertility. "
        "Regular soil testing every 2 years to monitor macro and micronutrient levels. "
        "Practice crop rotation to maintain biological diversity and avoid pest buildup."
    ),
}

SOIL_ADVICE_NP = {
    "Low": (
        "तपाईंको माटोको उर्वरता कम छ। माटोको स्वास्थ्य सुधार गर्न तुरुन्त कदम चाल्नुहोस्। "
        "बीउ छर्नुअघि ५–१० टन/हेक्टर राम्ररी कुहेको कम्पोस्ट वा गोबर मल प्रयोग गर्नुहोस्। "
        "सबै मुख्य पोषक तत्व कमी सुधार गर्न एनपीके २०-२०-२० सन्तुलित मल प्रयोग गर्नुहोस्। "
        "मुख्य बालीअघि ढैंचा (सेसबानिया) हरियो मल गर्ने विचार गर्नुहोस्। "
        "स्थानीय कृषि कार्यालयबाट माटो स्वास्थ्य कार्ड परीक्षण गर्नुहोस्। "
        "माटोको पीएच ५.५ भन्दा कम छ भने चुना (१–२ टन/हेक्टर) आवश्यक पर्न सक्छ।"
    ),
    "Medium": (
        "तपाईंको माटोको उर्वरता मध्यम छ — अधिकांश बालीका लागि राम्रो आधार। "
        "नियमित जैविक पदार्थ (वार्षिक २–३ टन/हेक्टर कम्पोस्ट) थपेर उर्वरता कायम राख्नुहोस्। "
        "बालीको पोषक तत्व आवश्यकता अनुसार लक्षित मलखाद प्रयोग गर्नुहोस्। "
        "पोषक तत्व ह्रास रोक्न बाली चक्र अपनाउनुहोस्: धानपछि दलहन (मसुरो, चना) लगाउनुहोस्। "
        "बीउ छर्दा डीएपी र सक्रिय वृद्धिमा युरिया टप–ड्रेस गर्नुहोस्।"
    ),
    "High": (
        "तपाईंको माटोको उर्वरता उच्च छ — अधिकांश बालीका लागि उत्कृष्ट अवस्था। "
        "उच्च मूल्यका बाली जस्तै तरकारी, फलफूल र नगदे बालीका लागि आदर्श। "
        "बाली अवशेष फर्काएर र कम्पोस्ट (२ टन/हेक्टर) प्रयोग गरेर उर्वरता कायम राख्नुहोस्। "
        "पोषक तत्व असन्तुलन निगरानी गर्नुहोस् — उच्च उर्वरतामा N वा P बढ्न सक्छ। "
        "राम्रो आधारभूत उर्वरता भएकाले रासायनिक मल २०–२५% घटाउने विचार गर्नुहोस्।"
    ),
}
