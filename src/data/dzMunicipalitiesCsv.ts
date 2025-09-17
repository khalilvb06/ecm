import type { Municipality } from "./dzMunicipalities";

// CSV schema:
// id,commune_name,commune_name_ascii,daira_name,daira_name_ascii,wilaya_code,wilaya_name,wilaya_name_ascii
const csvData = `id,commune_name,commune_name_ascii,daira_name,daira_name_ascii,wilaya_code,wilaya_name,wilaya_name_ascii
22,تيمقتن,Timekten,أولف,Aoulef,01,أدرار,Adrar
6,بودة,Bouda,أدرار,Adrar,01,أدرار,Adrar
13,أولاد أحمد تيمي,Ouled Ahmed Timmi,أدرار,Adrar,01,أدرار,Adrar
1,أدرار,Adrar,أدرار,Adrar,01,أدرار,Adrar
9,فنوغيل,Fenoughil,فنوغيل,Fenoughil,01,أدرار,Adrar
10,إن زغمير,In Zghmir,زاوية كنتة,Zaouiat Kounta,01,أدرار,Adrar
16,رقان,Reggane,رقان,Reggane,01,أدرار,Adrar
17,سالي,Sali,رقان,Reggane,01,أدرار,Adrar
18,السبع,Sebaa,تسابيت,Tsabit,01,أدرار,Adrar
27,تسابيت,Tsabit,تسابيت,Tsabit,01,أدرار,Adrar
21,تامست,Tamest,فنوغيل,Fenoughil,01,أدرار,Adrar
20,تامنطيط,Tamantit,فنوغيل,Fenoughil,01,أدرار,Adrar
26,تيت,Tit,أولف,Aoulef,01,أدرار,Adrar
28,زاوية كنتة,Zaouiet Kounta,زاوية كنتة,Zaouiat Kounta,01,أدرار,Adrar
2,اقبلي,Akabli,أولف,Aoulef,01,أدرار,Adrar
4,أولف,Aoulef,أولف,Aoulef,01,أدرار,Adrar
60,تلعصة,Talassa,أبو الحسن,Abou El Hassane,02," الشلف",Chlef
63,الزبوجة,Zeboudja,الزبوجة,Zeboudja,02," الشلف",Chlef
41,الحجاج,El Hadjadj,أولاد بن عبد القادر,Ouled Ben Abdelkader,02," الشلف",Chlef
52,أولاد بن عبد القادر,Ouled Ben Abdelkader,أولاد بن عبد القادر,Ouled Ben Abdelkader,02," الشلف",Chlef
30,عين مران,Ain Merane,عين مران,Ain Merane,02," الشلف",Chlef
37,بريرة,Breira,بني حواء,Beni Haoua,02," الشلف",Chlef
51,أولاد عباس,Ouled Abbes,وادي الفضة,Oued Fodda,02," الشلف",Chlef
48,وادي الفضة,Oued Fodda,وادي الفضة,Oued Fodda,02," الشلف",Chlef
34,بني راشد,Beni Rached,وادي الفضة,Oued Fodda,02," الشلف",Chlef
45,الهرانفة,Herenfa,عين مران,Ain Merane,02," الشلف",Chlef
59,تاجنة,Tadjena,أبو الحسن,Abou El Hassane,02," الشلف",Chlef
43,المرسى,El Marsa,المرسى,El Marsa,02," الشلف",Chlef
39,الشلف,Chlef,الشلف,Chlef,02," الشلف",Chlef
54,أم الدروع,Oum Drou,الشلف,Chlef,02," الشلف",Chlef
55,سنجاس,Sendjas,الشلف,Chlef,02," الشلف",Chlef
56,سيدي عبد الرحمن,Sidi Abderrahmane,تنس,Tenes,02," الشلف",Chlef
57,سيدي عكاشة,Sidi Akkacha,تنس,Tenes,02," الشلف",Chlef
62,تنس,Tenes,تنس,Tenes,02," الشلف",Chlef
32,بني بوعتاب,Beni  Bouattab,الكريمية,El Karimia,02," الشلف",Chlef
42,الكريمية,El Karimia,الكريمية,El Karimia,02," الشلف",Chlef
44,حرشون,Harchoun,الكريمية,El Karimia,02," الشلف",Chlef
36,بوزغاية,Bouzeghaia,الزبوجة,Zeboudja,02," الشلف",Chlef
61,تاوقريت,Taougrit,تاوقريت,Taougrit,02," الشلف",Chlef
33,بني حواء,Beni Haoua,بني حواء,Beni Haoua,02," الشلف",Chlef
29,أبو الحسن,Abou El Hassane,أبو الحسن,Abou El Hassane,02," الشلف",Chlef
49,وادي قوسين,Oued Goussine,بني حواء,Beni Haoua,02," الشلف",Chlef
38,الشطية,Chettia,أولاد فارس,Ouled Fares,02," الشلف",Chlef
47,مصدق,Moussadek,المرسى,El Marsa,02," الشلف",Chlef
53,أولاد فارس,Ouled Fares,أولاد فارس,Ouled Fares,02," الشلف",Chlef
35,بوقادير,Boukadir,بوقادير,Boukadir,02," الشلف",Chlef
50,وادي سلي,Oued Sly,بوقادير,Boukadir,02," الشلف",Chlef
58,الصبحة,Sobha,بوقادير,Boukadir,02," الشلف",Chlef
31,بنايرية,Benairia,الزبوجة,Zeboudja,02," الشلف",Chlef
46,الأبيض مجاجة,Labiod Medjadja,أولاد فارس,Ouled Fares,02," الشلف",Chlef
40,الظهرة,Dahra,تاوقريت,Taougrit,02," الشلف",Chlef
67,البيضاء,El Beidha,قتلة سيدي سعيد,Gueltat Sidi Saad,03,الأغواط,Laghouat
73,قلتة سيدي سعد,Gueltat Sidi Saad,قتلة سيدي سعيد,Gueltat Sidi Saad,03,الأغواط,Laghouat
69,بريدة,Brida,بريدة,Brida,03,الأغواط,Laghouat
66,عين سيدي علي,Ain Sidi Ali,قتلة سيدي سعيد,Gueltat Sidi Saad,03,الأغواط,Laghouat
85,تاجموت,Tadjemout,عين ماضي,Ain Madhi,03,الأغواط,Laghouat
74,الحاج مشري,Hadj Mechri,بريدة,Brida,03,الأغواط,Laghouat
87,تاويالة,Taouiala,بريدة,Brida,03,الأغواط,Laghouat
71,الغيشة,El Ghicha,الغيشة,El Ghicha,03,الأغواط,Laghouat
86,تاجرونة,Tadjrouna,عين ماضي,Ain Madhi,03,الأغواط,Laghouat
82,سبقاق,Sebgag,أفلو,Aflou,03,الأغواط,Laghouat
83,سيدي بوزيد,Sidi Bouzid,أفلو,Aflou,03,الأغواط,Laghouat
80,وادي مرة,Oued Morra,وادي مرة,Oued Morra,03,الأغواط,Laghouat
79,الأغواط,Laghouat,الأغواط,Laghouat,03,الأغواط,Laghouat
81,وادي مزي,Oued M'zi,وادي مرة,Oued Morra,03,الأغواط,Laghouat
78,قصر الحيران,Ksar El Hirane,قصر الحيران,Ksar El Hirane,03,الأغواط,Laghouat
70,العسافية,El Assafia,سيدي مخلوف,Sidi Makhlouf,03,الأغواط,Laghouat
84,سيدي مخلوف,Sidi Makhlouf,سيدي مخلوف,Sidi Makhlouf,03,الأغواط,Laghouat
75,حاسي الدلاعة,Hassi Delaa,حاسي الرمل,Hassi R'mel,03,الأغواط,Laghouat
76,حاسي الرمل,Hassi R'mel,حاسي الرمل,Hassi R'mel,03,الأغواط,Laghouat
65,عين ماضي,Ain Madhi,عين ماضي,Ain Madhi,03,الأغواط,Laghouat
72,الحويطة,El Haouaita,عين ماضي,Ain Madhi,03,الأغواط,Laghouat
77,الخنق,Kheneg,عين ماضي,Ain Madhi,03,الأغواط,Laghouat
68,بن ناصر بن شهرة,Benacer Benchohra,قصر الحيران,Ksar El Hirane,03,الأغواط,Laghouat
64,أفلو,Aflou,أفلو,Aflou,03,الأغواط,Laghouat
104,فكيرينة,Fkirina,فكيرينة,F'kirina,04,أم البواقي,Oum El Bouaghi
102,الفجوج بوغرارة سعودي,El Fedjoudj Boughrara Sa,عين فكرون,Ain Fekroun,04,أم البواقي,Oum El Bouaghi
91,عين فكرون,Ain Fekroun,عين فكرون,Ain Fekroun,04,أم البواقي,Oum El Bouaghi
113,الرحية,Rahia,مسكيانة,Meskiana,04,أم البواقي,Oum El Bouaghi
107,مسكيانة,Meskiana,مسكيانة,Meskiana,04,أم البواقي,Oum El Bouaghi
100,البلالة,El Belala,مسكيانة,Meskiana,04,أم البواقي,Oum El Bouaghi
95,بحير الشرقي,Behir Chergui,مسكيانة,Meskiana,04,أم البواقي,Oum El Bouaghi
106,قصر الصباحي,Ksar Sbahi,قصر الصباحي,Ksar Sbahi,04,أم البواقي,Oum El Bouaghi
115,سوق نعمان,Souk Naamane,سوق نعمان,Souk Naamane,04,أم البواقي,Oum El Bouaghi
111,أولاد زواي,Ouled Zouai,سوق نعمان,Souk Naamane,04,أم البواقي,Oum El Bouaghi
112,أم البواقي,Oum El Bouaghi,أم البواقي,Oum El Bouaghi,04,أم البواقي,Oum El Bouaghi
88,عين ببوش,Ain Babouche,عين ببوش,Ain Babouche,04,أم البواقي,Oum El Bouaghi
94,عين الزيتون,Ain Zitoun,أم البواقي,Oum El Bouaghi,04,أم البواقي,Oum El Bouaghi
97,بئر الشهداء,Bir Chouhada,سوق نعمان,Souk Naamane,04,أم البواقي,Oum El Bouaghi
89,عين البيضاء,Ain Beida,عين البيضاء,Ain Beida,04,أم البواقي,Oum El Bouaghi
96,بريش,Berriche,عين البيضاء,Ain Beida,04,أم البواقي,Oum El Bouaghi
116,الزرق,Zorg,عين البيضاء,Ain Beida,04,أم البواقي,Oum El Bouaghi
93,عين مليلة,Ain M'lila,عين مليلة,Ain M'lila,04,أم البواقي,Oum El Bouaghi
109,أولاد قاسم,Ouled Gacem,عين مليلة,Ain M'lila,04,أم البواقي,Oum El Bouaghi
110,أولاد حملة,Ouled Hamla,عين مليلة,Ain M'lila,04,أم البواقي,Oum El Bouaghi
99,العامرية,El Amiria,سيقوس,Sigus,04,أم البواقي,Oum El Bouaghi
114,سيقوس,Sigus,سيقوس,Sigus,04,أم البواقي,Oum El Bouaghi
108,وادي نيني,Oued Nini,فكيرينة,F'kirina,04,أم البواقي,Oum El Bouaghi
90,عين الديس,Ain Diss,عين ببوش,Ain Babouche,04,أم البواقي,Oum El Bouaghi
98,الضلعة,Dhalaa,الضلعة,Dhalaa,04,أم البواقي,Oum El Bouaghi
101,الجازية,El Djazia,الضلعة,Dhalaa,04,أم البواقي,Oum El Bouaghi
92,عين كرشة,Ain Kercha,عين كرشة,Ain Kercha,04,أم البواقي,Oum El Bouaghi
103,الحرملية,El Harmilia,عين كرشة,Ain Kercha,04,أم البواقي,Oum El Bouaghi
105,هنشير تومغني,Hanchir Toumghani,عين كرشة,Ain Kercha,04,أم البواقي,Oum El Bouaghi
150,معافة,Maafa,عين التوتة,Ain Touta,05,باتنة,Batna
139,القصبات,Gosbat,رأس العيون,Ras El Aioun,05,باتنة,Batna
176,تيمقاد,Timgad,تيمقاد,Timgad,05,باتنة,Batna
170,تاكسلانت,Taxlent,أولاد سي سليمان,Ouled Si Slimane,05,باتنة,Batna
161,أولاد سي سليمان,Ouled Si Slimane,أولاد سي سليمان,Ouled Si Slimane,05,باتنة,Batna
148,لمسان,Lemcene,أولاد سي سليمان,Ouled Si Slimane,05,باتنة,Batna
169,تالخمت,Talkhamt,رأس العيون,Ras El Aioun,05,باتنة,Batna
164,رأس العيون,Ras El Aioun,رأس العيون,Ras El Aioun,05,باتنة,Batna
163,الرحبات,Rahbat,رأس العيون,Ras El Aioun,05,باتنة,Batna
160,أولاد سلام,Ouled Sellem,رأس العيون,Ras El Aioun,05,باتنة,Batna
140,القيقبة,Guigba,رأس العيون,Ras El Aioun,05,باتنة,Batna
172,ثنية العابد,Teniet El Abed,ثنية العابد,Theniet El Abed,05,باتنة,Batna
123,باتنة,Batna,باتنة,Batna,05,باتنة,Batna
136,فسديس,Fesdis,باتنة,Batna,05,باتنة,Batna
154,وادي الشعبة,Oued Chaaba,باتنة,Batna,05,باتنة,Batna
141,حيدوسة,Hidoussa,مروانة,Merouana,05,باتنة,Batna
145,قصر بلزمة,Ksar Bellezma,مروانة,Merouana,05,باتنة,Batna
152,مروانة,Merouana,مروانة,Merouana,05,باتنة,Batna
155,وادي الماء,Oued El Ma,مروانة,Merouana,05,باتنة,Batna
147,لازرو,Lazrou,سريانة,Seriana,05,باتنة,Batna
167,سريانة,Seriana,سريانة,Seriana,05,باتنة,Batna
177,زانة البيضاء,Zanet El Beida,سريانة,Seriana,05,باتنة,Batna
151,منعة,Menaa,منعة,Menaa,05,باتنة,Batna
174,تغرغار,Tigharghar,منعة,Menaa,05,باتنة,Batna
119,عين ياقوت,Ain Yagout,المعذر,El Madher,05,باتنة,Batna
128,بومية,Boumia,المعذر,El Madher,05,باتنة,Batna
132,جرمة,Djerma,المعذر,El Madher,05,باتنة,Batna
135,المعذر,El Madher,المعذر,El Madher,05,باتنة,Batna
162,عيون العصافير,Ouyoun El Assafir,تازولت,Tazoult,05,باتنة,Batna
171,تازولت,Tazoult,تازولت,Tazoult,05,باتنة,Batna
127,بومقر,Boumagueur,نقاوس,N'gaous,05,باتنة,Batna
153,نقاوس,N Gaous,نقاوس,N'gaous,05,باتنة,Batna
165,سفيان,Sefiane,نقاوس,N'gaous,05,باتنة,Batna
120,أريس,Arris,أريس,Arris,05,باتنة,Batna
173,تيغانمين,Tighanimine,أريس,Arris,05,باتنة,Batna
117,عين جاسر,Ain Djasser,عين جاسر,Ain Djasser,05,باتنة,Batna
134,الحاسي,El Hassi,عين جاسر,Ain Djasser,05,باتنة,Batna
166,سقانة,Seggana,سقانة,Seggana,05,باتنة,Batna
175,تيلاطو,Tilatou,سقانة,Seggana,05,باتنة,Batna
137,فم الطوب,Foum Toub,إشمول,Ichemoul,05,باتنة,Batna
142,إشمول,Ichemoul,إشمول,Ichemoul,05,باتنة,Batna
143,إينوغيسن,Inoughissen,إشمول,Ichemoul,05,باتنة,Batna
129,بوزينة,Bouzina,بوزينة,Bouzina,05,باتنة,Batna
146,لارباع,Larbaa,بوزينة,Bouzina,05,باتنة,Batna
126,بولهيلات,Boulhilat,الشمرة,Chemora,05,باتنة,Batna
130,الشمرة,Chemora,الشمرة,Chemora,05,باتنة,Batna
122,بريكة,Barika,بريكة,Barika,05,باتنة,Batna
125,بيطام,Bitam,بريكة,Barika,05,باتنة,Batna
149,إمدوكل,M Doukal,بريكة,Barika,05,باتنة,Batna
121,عزيل عبد القادر,Azil Abedelkader,الجزار,Djezzar,05,باتنة,Batna
133,الجزار,Djezzar,الجزار,Djezzar,05,باتنة,Batna
157,أولاد عمار,Ouled Ammar,الجزار,Djezzar,05,باتنة,Batna
138,غسيرة,Ghassira,تكوت,Tkout,05,باتنة,Batna
144,كيمل,Kimmel,تكوت,Tkout,05,باتنة,Batna
168,تكوت,T Kout,تكوت,Tkout,05,باتنة,Batna
118,عين التوتة,Ain Touta,عين التوتة,Ain Touta,05,باتنة,Batna
124,بني فضالة الحقانية,Beni Foudhala El Hakania,عين التوتة,Ain Touta,05,باتنة,Batna
159,أولاد فاضل,Ouled Fadel,تيمقاد,Timgad,05,باتنة,Batna
158,أولاد عوف,Ouled Aouf,عين التوتة,Ain Touta,05,باتنة,Batna
131,شير,Chir,ثنية العابد,Theniet El Abed,05,باتنة,Batna
156,وادي الطاقة,Oued Taga,ثنية العابد,Theniet El Abed,05,باتنة,Batna
...`;

function parseCsv(csv: string): Record<number, Municipality[]> {
	const map: Record<number, Municipality[]> = {};
	const seenByWilaya: Record<number, Set<string>> = {};
	csv.split(/\r?\n/).forEach((line, idx) => {
		if (!line || idx === 0) return;
		const parts = line.split(",");
		if (parts.length < 8) return;
		const communeName = parts[1]?.trim();
		const wilayaCodeRaw = parts[5]?.trim();
		if (!communeName || !wilayaCodeRaw) return;
		const wilayaCode = parseInt(wilayaCodeRaw, 10);
		if (!Number.isFinite(wilayaCode)) return;
		if (!map[wilayaCode]) map[wilayaCode] = [];
		if (!seenByWilaya[wilayaCode]) seenByWilaya[wilayaCode] = new Set<string>();
		if (seenByWilaya[wilayaCode].has(communeName)) return;
		map[wilayaCode].push({ id: communeName, municipality_name: communeName });
		seenByWilaya[wilayaCode].add(communeName);
	});
	return map;
}

export const dzMunicipalitiesMapCsv: Record<number, Municipality[]> = parseCsv(csvData);


