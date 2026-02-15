/* ============================================================
   vehicleData.js — Generic Vehicle Data (3 Categories)
   Categories: motorbikes, jeeps, minibuses
   ============================================================ */

const vehicleData = {
    motorbikes: [
        {
            id: 'bike-1',
            nameKey: 'Honda Air Blade 125',
            type: 'scooter',
            badgeKey: 'feat_automatic',
            price: 150000,
            priceUnit: 'per_day',
            currency: 'VND',
            image: 'assets/images/products/honda-air-blade-125-2026-the-thao-xam-do-den.webp',
            features: ['feat_automatic', 'feat_125cc', 'feat_helmet', 'feat_delivery']
        },
        {
            id: 'bike-2',
            nameKey: 'Honda Vision 2026',
            type: 'scooter',
            badgeKey: 'feat_automatic',
            price: 150000,
            priceUnit: 'per_day',
            currency: 'VND',
            image: 'assets/images/products/honda-vision-2026-the-thao-xam-den.webp',
            features: ['feat_automatic', 'feat_125cc', 'feat_helmet', 'feat_delivery']
        },
        {
            id: 'bike-3',
            nameKey: 'Honda Lead ABS',
            type: 'scooter',
            badgeKey: 'feat_automatic',
            price: 150000,
            priceUnit: 'per_day',
            currency: 'VND',
            image: 'assets/images/products/honda-lead-abs-dac-biet-bac-den-.webp',
            features: ['feat_automatic', 'feat_125cc', 'feat_helmet', 'feat_delivery']
        },
        {
            id: 'bike-4',
            nameKey: 'Yamaha Nouvo 5',
            type: 'scooter',
            badgeKey: 'feat_automatic',
            price: 120000,
            priceUnit: 'per_day',
            currency: 'VND',
            image: 'assets/images/products/yamaha-nouvo-5.webp',
            features: ['feat_automatic', 'feat_125cc', 'feat_helmet', 'feat_delivery']
        },
        {
            id: 'bike-5',
            nameKey: 'Honda PCX 150',
            type: 'scooter',
            badgeKey: 'feat_automatic',
            price: 180000,
            priceUnit: 'per_day',
            currency: 'VND',
            image: 'assets/images/products/honda-pcx-150.webp',
            features: ['feat_automatic', 'feat_150cc', 'feat_helmet', 'feat_delivery']
        },
        {
            id: 'bike-6',
            nameKey: 'Yamaha NVX 155',
            type: 'scooter',
            badgeKey: 'feat_automatic',
            price: 180000,
            priceUnit: 'per_day',
            currency: 'VND',
            image: 'assets/images/products/nvx-155-v3-d121-den.webp',
            features: ['feat_automatic', 'feat_150cc', 'feat_helmet', 'feat_delivery']
        }
    ],

    jeeps: [
        {
            id: 'jeep-1',
            nameKey: 'Sunrise Sand Dune Tour',
            type: 'tour',
            badgeKey: 'feat_private',
            price: 800000,
            priceUnit: 'per_tour',
            currency: 'VND',
            image: 'https://placehold.co/600x400/111/fff?text=Sunrise+Dune+Tour',
            features: ['feat_4seats', 'feat_private', 'feat_guide', 'feat_sunrise_sunset'],
            tourTimes: ['sunrise', 'sunset']
        },
        {
            id: 'jeep-2',
            nameKey: 'Sunset Sand Dune Tour',
            type: 'tour',
            badgeKey: 'feat_private',
            price: 700000,
            priceUnit: 'per_tour',
            currency: 'VND',
            image: 'https://placehold.co/600x400/111/fff?text=Sunset+Dune+Tour',
            features: ['feat_4seats', 'feat_private', 'feat_guide', 'feat_sunrise_sunset'],
            tourTimes: ['sunrise', 'sunset']
        },
        {
            id: 'jeep-3',
            nameKey: 'White Dunes Adventure',
            type: 'tour',
            badgeKey: 'feat_guide',
            price: 1000000,
            priceUnit: 'per_tour',
            currency: 'VND',
            image: 'https://placehold.co/600x400/111/fff?text=White+Dunes+Tour',
            features: ['feat_4seats', 'feat_private', 'feat_guide'],
            tourTimes: ['sunrise', 'sunset']
        }
    ],

    minibuses: [
        {
            id: 'van-1',
            nameKey: 'Airport Transfer — HCM',
            type: 'transfer',
            badgeKey: 'feat_airport',
            price: 2500000,
            priceUnit: 'per_trip',
            currency: 'VND',
            image: 'https://placehold.co/600x400/111/fff?text=Airport+Transfer',
            features: ['feat_16seats', 'feat_airport', 'feat_ac', 'feat_luggage'],
            capacity: 16
        },
        {
            id: 'van-2',
            nameKey: 'Family Day Tour',
            type: 'transfer',
            badgeKey: 'feat_16seats',
            price: 1800000,
            priceUnit: 'per_day',
            currency: 'VND',
            image: 'https://placehold.co/600x400/111/fff?text=Family+Day+Tour',
            features: ['feat_16seats', 'feat_ac', 'feat_luggage'],
            capacity: 16
        },
        {
            id: 'van-3',
            nameKey: 'Mui Ne — Da Lat Transfer',
            type: 'transfer',
            badgeKey: 'feat_private',
            price: 3000000,
            priceUnit: 'per_trip',
            currency: 'VND',
            image: 'https://placehold.co/600x400/111/fff?text=Dalat+Transfer',
            features: ['feat_16seats', 'feat_private', 'feat_ac', 'feat_luggage'],
            capacity: 16
        }
    ]
};

/* Hotel & Resort list for autocomplete (Phan Thiet - Mui Ne) */
const hotelList = [
    // 5-Star Resorts
    { name: 'Anantara Mui Ne Resort & Spa', address: '12A Nguyen Dinh Chieu, Phu Hai, Phan Thiet' },
    { name: 'Centara Mirage Resort Mui Ne', address: 'Nguyen Thong, Phu Hai, Phan Thiet' },
    { name: 'Mandala Cham Bay Mui Ne', address: 'Km9, Nguyen Dinh Chieu, Ham Tien, Phan Thiet' },
    { name: 'Mia Resort Mui Ne', address: '24 Nguyen Dinh Chieu, Ham Tien, Phan Thiet' },
    { name: 'Sea Links Beach Resort & Golf', address: 'Phu Hai, Phan Thiet' },
    { name: 'Asteria Mui Ne Resort', address: 'Nguyen Dinh Chieu, Ham Tien, Phan Thiet' },
    { name: 'NovaHills Mui Ne Resort & Villas', address: 'Phu Hai, Phan Thiet' },

    // 4-Star Resorts
    { name: 'The Cliff Resort & Residences', address: 'Zone 5, Phu Hai, Phan Thiet' },
    { name: 'Victoria Phan Thiet Beach Resort & Spa', address: 'Km 9, Phu Hai, Phan Thiet' },
    { name: 'Pandanus Resort', address: 'Lot C2, Mui Ne, Phan Thiet' },
    { name: 'Sailing Club Resort Mui Ne', address: '24 Nguyen Dinh Chieu, Ham Tien, Phan Thiet' },
    { name: 'Terracotta Resort & Spa', address: 'Nguyen Dinh Chieu, Ham Tien, Phan Thiet' },
    { name: 'Muine Bay Resort', address: 'Nguyen Dinh Chieu, Ham Tien, Phan Thiet' },
    { name: 'Bamboo Village Beach Resort & Spa', address: '38 Nguyen Dinh Chieu, Ham Tien, Phan Thiet' },
    { name: 'Sea Lion Beach Resort & Spa', address: 'Nguyen Dinh Chieu, Ham Tien, Phan Thiet' },
    { name: 'Coral Sea Resort Mui Ne', address: 'Nguyen Dinh Chieu, Ham Tien, Phan Thiet' },
    { name: 'Lotus Village Resort', address: 'Nguyen Dinh Chieu, Mui Ne, Phan Thiet' },
    { name: 'Allezboo Beach Resort & Spa', address: '52 Nguyen Dinh Chieu, Ham Tien, Phan Thiet' },
    { name: 'Saigon Mui Ne Resort', address: '56-97 Nguyen Dinh Chieu, Ham Tien, Phan Thiet' },
    { name: 'Blue Ocean Resort', address: '54 Nguyen Dinh Chieu, Ham Tien, Phan Thiet' },
    { name: 'Sunny Beach Resort & Spa', address: 'Nguyen Dinh Chieu, Ham Tien, Phan Thiet' },
    { name: 'Novotel Phan Thiet', address: '4 Le Quy Don, Phan Thiet' },

    // 3-Star Hotels & Resorts
    { name: 'Coco Beach Resort', address: '58 Nguyen Dinh Chieu, Ham Tien, Phan Thiet' },
    { name: 'Phu Hai Resort', address: 'Zone 1, Phu Hai, Phan Thiet' },
    { name: 'Sea Links Beach Hotel', address: 'Phu Hai, Phan Thiet' },
    { name: 'Lotus Muine Resort & Spa', address: 'Nguyen Dinh Chieu, Mui Ne, Phan Thiet' },
    { name: 'Long Hai Beach Resort', address: 'Nguyen Dinh Chieu, Ham Tien, Phan Thiet' },
    { name: 'Romana Resort & Spa', address: 'Nguyen Dinh Chieu, Mui Ne, Phan Thiet' },
    { name: 'Canary Beach Resort', address: '12 Nguyen Dinh Chieu, Ham Tien, Phan Thiet' },
    { name: 'Hoang Ngoc Beach Resort', address: 'Nguyen Dinh Chieu, Ham Tien, Phan Thiet' },
    { name: 'Grace Boutique Resort', address: 'Nguyen Dinh Chieu, Ham Tien, Phan Thiet' },
    { name: 'Duong Bien Resort', address: 'Nguyen Dinh Chieu, Ham Tien, Phan Thiet' },
    { name: 'Chez Carole Resort', address: 'Nguyen Dinh Chieu, Mui Ne, Phan Thiet' },
    { name: 'Ocean Star Resort', address: 'Nguyen Dinh Chieu, Ham Tien, Phan Thiet' },
    { name: 'Havana Mui Ne Hotel', address: '9 Nguyen Dinh Chieu, Ham Tien, Phan Thiet' },
    { name: 'Unique Mui Ne Resort', address: 'Nguyen Dinh Chieu, Ham Tien, Phan Thiet' },
    { name: 'Muine De Century Beach Resort & Spa', address: 'Nguyen Dinh Chieu, Ham Tien, Phan Thiet' },
    { name: 'Fiore Healthy Resort', address: 'Nguyen Dinh Chieu, Ham Tien, Phan Thiet' },
    { name: 'The Pegasus Resort', address: 'Nguyen Dinh Chieu, Ham Tien, Phan Thiet' },
    { name: 'Little Mui Ne Cottages', address: 'Nguyen Dinh Chieu, Ham Tien, Phan Thiet' },
    { name: 'Mui Ne Paradise Beach Resort', address: 'Nguyen Dinh Chieu, Mui Ne, Phan Thiet' },
    { name: 'Takalau Residence', address: 'Nguyen Dinh Chieu, Ham Tien, Phan Thiet' },
    { name: 'Amaryllis Resort & Spa', address: '96 Nguyen Dinh Chieu, Ham Tien, Phan Thiet' },
    { name: 'Swiss Village Resort & Spa', address: 'Nguyen Dinh Chieu, Ham Tien, Phan Thiet' },
    { name: 'Ocean Vista Mui Ne', address: 'Ham Tien, Phan Thiet' },

    // Budget & Boutique Hotels
    { name: 'Mui Ne Hills Budget Hotel', address: 'Nguyen Dinh Chieu, Mui Ne, Phan Thiet' },
    { name: 'Lien Hiep Thanh Resort', address: 'Nguyen Dinh Chieu, Ham Tien, Phan Thiet' },
    { name: 'Forest Mui Ne Villa', address: 'Nguyen Dinh Chieu, Mui Ne, Phan Thiet' },
    { name: 'Windmill Resort Phan Thiet', address: 'Nguyen Dinh Chieu, Ham Tien, Phan Thiet' },
    { name: 'Tropicana Resort', address: '20 Nguyen Dinh Chieu, Ham Tien, Phan Thiet' },
    { name: 'Bien Dong Resort', address: 'Nguyen Dinh Chieu, Ham Tien, Phan Thiet' },
    { name: 'Backyard Oasis Mui Ne', address: 'Nguyen Dinh Chieu, Mui Ne, Phan Thiet' },
    { name: 'Nhat Huy Boutique Hotel', address: 'Nguyen Dinh Chieu, Ham Tien, Phan Thiet' },
    { name: 'Gaia Mui Ne Resort', address: 'Nguyen Dinh Chieu, Mui Ne, Phan Thiet' },
    { name: 'Full Moon Village Resort', address: 'Nguyen Dinh Chieu, Mui Ne, Phan Thiet' },
    { name: 'Golden Coast Resort & Spa', address: 'Nguyen Dinh Chieu, Mui Ne, Phan Thiet' },
    { name: 'Cham Villas Boutique Luxury Resort', address: '32 Nguyen Dinh Chieu, Ham Tien, Phan Thiet' },
    { name: 'The Beach Village', address: 'Nguyen Dinh Chieu, Mui Ne, Phan Thiet' },
    { name: 'Sunsea Resort', address: 'Nguyen Dinh Chieu, Ham Tien, Phan Thiet' },
    { name: 'Saigon Ninh Chu Hotel', address: 'Ninh Thuan, Phan Thiet' },
];
