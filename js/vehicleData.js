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
            image: 'assets/images/products/bike/honda-air-blade-125-2026-the-thao-xam-do-den.webp',
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
            image: 'assets/images/products/bike/honda-vision-2026-the-thao-xam-den.webp',
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
            image: 'assets/images/products/bike/honda-lead-abs-dac-biet-bac-den-.webp',
            features: ['feat_automatic', 'feat_125cc', 'feat_helmet', 'feat_delivery']
        },
        {
            id: 'bike-4',
            nameKey: 'Yamaha Nouvo 5',
            type: 'scooter',
            badgeKey: 'feat_automatic',
            price: 130000,
            priceUnit: 'per_day',
            currency: 'VND',
            image: 'assets/images/products/bike/yamaha-nouvo-5.webp',
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
            image: 'assets/images/products/bike/honda-pcx-150.webp',
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
            image: 'assets/images/products/bike/nvx-155-v3-d121-den.webp',
            features: ['feat_automatic', 'feat_150cc', 'feat_helmet', 'feat_delivery']
        }
    ],

    jeeps: [
        {
            id: 'jeep-1',
            nameKey: 'veh_jeep_vang',
            type: 'tour',
            badgeKey: 'feat_private',
            price: 650000,
            priceUnit: 'per_tour',
            currency: 'VND',
            image: 'assets/images/products/jeep/xe-jeep-vang.webp',
            features: ['feat_4seats', 'feat_private', 'feat_guide', 'feat_sunrise_sunset'],
            tourTimes: ['sunrise', 'sunset']
        },
        {
            id: 'jeep-2',
            nameKey: 'veh_jeep_hong',
            type: 'tour',
            badgeKey: 'feat_private',
            price: 650000,
            priceUnit: 'per_tour',
            currency: 'VND',
            image: 'assets/images/products/jeep/xe-jeep-hong.webp',
            features: ['feat_4seats', 'feat_private', 'feat_guide', 'feat_sunrise_sunset'],
            tourTimes: ['sunrise', 'sunset']
        },
        {
            id: 'jeep-3',
            nameKey: 'veh_jeep_xanh_luc',
            type: 'tour',
            badgeKey: 'feat_private',
            price: 650000,
            priceUnit: 'per_tour',
            currency: 'VND',
            image: 'assets/images/products/jeep/xe-jeep-xanh-luc.webp',
            features: ['feat_4seats', 'feat_private', 'feat_guide', 'feat_sunrise_sunset'],
            tourTimes: ['sunrise', 'sunset']
        },
        {
            id: 'jeep-4',
            nameKey: 'veh_jeep_xanh_duong',
            type: 'tour',
            badgeKey: 'feat_private',
            price: 650000,
            priceUnit: 'per_tour',
            currency: 'VND',
            image: 'assets/images/products/jeep/xe-jeep-xanh-duong.webp',
            features: ['feat_4seats', 'feat_private', 'feat_guide', 'feat_sunrise_sunset'],
            tourTimes: ['sunrise', 'sunset']
        },
        {
            id: 'jeep-5',
            nameKey: 'veh_jeep_trang',
            type: 'tour',
            badgeKey: 'feat_private',
            price: 650000,
            priceUnit: 'per_tour',
            currency: 'VND',
            image: 'assets/images/products/jeep/xe-jeep-trang.webp',
            features: ['feat_4seats', 'feat_private', 'feat_guide', 'feat_sunrise_sunset'],
            tourTimes: ['sunrise', 'sunset']
        }
    ],

    minibuses: [
        {
            id: 'van-1',
            nameKey: 'Ford Transit',
            type: 'transfer',
            badgeKey: 'feat_airport',
            price: 2600000,
            priceUnit: 'per_trip',
            currency: 'VND',
            image: 'assets/images/products/minibus/ford-transit.webp',
            features: ['feat_16seats', 'feat_airport', 'feat_ac', 'feat_luggage'],
            capacity: 16
        },
        {
            id: 'van-2',
            nameKey: 'Hyundai Solati',
            type: 'transfer',
            badgeKey: 'feat_16seats',
            price: 2600000,
            priceUnit: 'per_trip',
            currency: 'VND',
            image: 'assets/images/products/minibus/hyundai-solati.webp',
            features: ['feat_16seats', 'feat_ac', 'feat_luggage'],
            capacity: 16
        },
        {
            id: 'van-3',
            nameKey: 'Toyota Fortuner',
            type: 'transfer',
            badgeKey: 'feat_private',
            price: 1690000,
            priceUnit: 'per_trip',
            currency: 'VND',
            image: 'assets/images/products/minibus/toyota-fortuner.webp',
            features: ['feat_7seats', 'feat_private', 'feat_ac', 'feat_luggage'],
            capacity: 7
        }
    ]
};

/* Hotel & Resort list for autocomplete (Phan Thiet - Mui Ne) */
const hotelList = [
    { name: 'Anantara Mui Ne Resort', address: '12A Nguyễn Đình Chiểu, Hàm Tiến, Phan Thiết' },
    { name: 'Mũi Né Bay Resort', address: '59 Nguyễn Đình Chiểu, Hàm Tiến, Phan Thiết' },
    { name: 'Pandanus Resort', address: '3 Nguyễn Hữu Thọ, Mũi Né, Phan Thiết' },
    { name: 'Sea Links Beach Hotel', address: 'Km 9, Nguyễn Thông, Phú Hải, Phan Thiết' },
    { name: 'Victoria Phan Thiet Beach Resort', address: 'Km 9, Phú Hài, Phan Thiết' },
    { name: 'Sailing Club Mui Ne', address: '24 Nguyễn Đình Chiểu, Hàm Tiến, Phan Thiết' },
    { name: 'The Cliff Resort & Residences', address: 'Khu 5, Phú Hài, Phan Thiết' },
    { name: 'Novotel Phan Thiet', address: '1 Nguyễn Đình Chiểu, Phú Hài, Phan Thiết' },
    { name: 'Centara Mirage Resort Mui Ne', address: 'Huỳnh Thúc Kháng, Hàm Tiến, Phan Thiết' },
    { name: 'Mia Resort Mui Ne', address: '24 Nguyễn Đình Chiểu, Hàm Tiến, Phan Thiết' },
    { name: 'Allezboo Beach Resort', address: '8 Nguyễn Đình Chiểu, Hàm Tiến, Phan Thiết' },
    { name: 'Bamboo Village Beach Resort', address: '38 Nguyễn Đình Chiểu, Hàm Tiến, Phan Thiết' },
    { name: 'Blue Ocean Resort', address: '54 Nguyễn Đình Chiểu, Hàm Tiến, Phan Thiết' },
    { name: 'Coco Beach Resort', address: '58 Nguyễn Đình Chiểu, Hàm Tiến, Phan Thiết' },
    { name: 'Mui Ne Hills Budget Hotel', address: '69 Nguyễn Đình Chiểu, Hàm Tiến, Phan Thiết' },
    { name: 'Sunny Beach Resort', address: '64-66 Nguyễn Đình Chiểu, Hàm Tiến, Phan Thiết' },
    { name: 'Lotus Mui Ne Resort', address: 'Khu 5, Phú Hài, Phan Thiết' },
    { name: 'Romana Resort & Spa', address: 'Km 8, Phú Hài, Phan Thiết' },
    { name: 'Seahorse Resort & Spa', address: '16 Nguyễn Đình Chiểu, Hàm Tiến, Phan Thiết' },
    { name: 'Amiana Resort Phan Thiet', address: '2 Nguyễn Đình Chiểu, Phú Hài, Phan Thiết' },
    { name: 'Aroma Beach Resort & Spa', address: 'Khu 5, Phú Hài, Phan Thiết' },
    { name: 'Champa Resort & Spa', address: '2 Nguyễn Đình Chiểu, Hàm Tiến, Phan Thiết' },
    { name: 'Fiore Healthy Resort', address: 'Tiến Thành, Phan Thiết' },
    { name: 'Grace Boutique Resort', address: '144A Nguyễn Đình Chiểu, Mũi Né, Phan Thiết' },
    { name: 'Hoàng Ngọc Beach Resort', address: '152 Nguyễn Đình Chiểu, Hàm Tiến, Phan Thiết' },
    { name: 'Long Beach Resort', address: '7 Nguyễn Đình Chiểu, Phú Hài, Phan Thiết' },
    { name: 'Muine de Century Beach Resort', address: 'Huỳnh Thúc Kháng, Hàm Tiến, Phan Thiết' },
    { name: 'Phan Thiet Ocean Dunes Resort', address: '1 Tôn Đức Thắng, Phú Hài, Phan Thiết' },
    { name: 'Sài Gòn - Mũi Né Resort', address: '56-97 Nguyễn Đình Chiểu, Hàm Tiến, Phan Thiết' },
    { name: 'Unique Mui Ne Resort', address: '20B Nguyễn Đình Chiểu, Hàm Tiến, Phan Thiết' },
    { name: 'Tien Dat Resort & Spa', address: '94A Nguyễn Đình Chiểu, Hàm Tiến, Phan Thiết' },
    { name: 'Novela Mui Ne Resort & Spa', address: '96A Nguyễn Đình Chiểu, Hàm Tiến, Phan Thiết' },
    { name: 'Palado Hotel Mui Ne', address: '98B Nguyễn Đình Chiểu, Hàm Tiến, Phan Thiết' },
    { name: 'The Anam Mui Ne', address: '18 Nguyễn Đình Chiểu, Hàm Tiến, Phan Thiết' },
    { name: 'Sea Lion Beach Resort', address: '12 Nguyễn Đình Chiểu, Hàm Tiến, Phan Thiết' },
    { name: 'Terracotta Resort & Spa', address: '28 Nguyễn Đình Chiểu, Hàm Tiến, Phan Thiết' },
    { name: 'Cham Villas Boutique Resort', address: '32 Nguyễn Đình Chiểu, Hàm Tiến, Phan Thiết' },
    { name: 'Swiss Village Resort & Spa', address: '44 Nguyễn Đình Chiểu, Hàm Tiến, Phan Thiết' },
    { name: 'Vinh Sương Seaside Hotel', address: '46 Nguyễn Đình Chiểu, Hàm Tiến, Phan Thiết' },
    { name: 'Sunsea Resort', address: '50 Nguyễn Đình Chiểu, Hàm Tiến, Phan Thiết' },
    { name: 'Villa Aria Mui Ne', address: '60A Nguyễn Đình Chiểu, Hàm Tiến, Phan Thiết' },
    { name: 'Sunrise Resort', address: '72 Nguyễn Đình Chiểu, Hàm Tiến, Phan Thiết' },
    { name: 'Sand Beach Resort', address: '128 Nguyễn Đình Chiểu, Hàm Tiến, Phan Thiết' },
    { name: 'Dynasty Mui Ne Beach Resort', address: '140A Nguyễn Đình Chiểu, Hàm Tiến, Phan Thiết' },
    { name: 'Ravenala Boutique Resort', address: '146 Nguyễn Đình Chiểu, Hàm Tiến, Phan Thiết' },
    { name: 'Ananda Resort', address: '148 Nguyễn Đình Chiểu, Hàm Tiến, Phan Thiết' },
    { name: 'Phú Hải Beach Resort & Spa', address: 'Khu 5, Phú Hài, Phan Thiết' },
    { name: 'Cà Ty Mui Ne Resort', address: '6 Nguyễn Đình Chiểu, Hàm Tiến, Phan Thiết' },
    { name: 'Vipol Hotel Mui Ne', address: '29A Nguyễn Đình Chiểu, Hàm Tiến, Phan Thiết' },
    { name: 'Minh Tam Resort', address: '130C Nguyễn Đình Chiểu, Hàm Tiến, Phan Thiết' },
    { name: 'Mũi Né Paradise Resort', address: '130D Nguyễn Đình Chiểu, Mũi Né, Phan Thiết' },
    { name: 'The Mui Ne Resort', address: '144 Nguyễn Đình Chiểu, Hàm Tiến, Phan Thiết' },
    { name: 'Ocean Valley Hotel', address: '187 Nguyễn Đình Chiểu, Hàm Tiến, Phan Thiết' },
    { name: 'Ocean Place Resort', address: '192/2 Nguyễn Đình Chiểu, Hàm Tiến, Phan Thiết' },
    { name: 'Canary Beach Resort', address: '60 Huỳnh Thúc Kháng, Hàm Tiến, Phan Thiết' },
    { name: 'Hải Âu Mui Ne Beach Resort', address: '32 Huỳnh Thúc Kháng, Hàm Tiến, Phan Thiết' },
    { name: 'Thái Hòa Mũi Né Resort', address: '56 Huỳnh Thúc Kháng, Hàm Tiến, Phan Thiết' },
    { name: 'Mường Thanh Holiday Mũi Né', address: '54 Huỳnh Thúc Kháng, Hàm Tiến, Phan Thiết' },
    { name: 'Little Mui Ne Cottages Resort', address: '10B Huỳnh Thúc Kháng, Hàm Tiến, Phan Thiết' },
    { name: 'Muine Bay Resort', address: 'Khu phố 14, Mũi Né, Phan Thiết' },
    { name: 'Radisson Resort Mui Ne', address: '16 Nguyễn Cơ Thạch, Mũi Né, Phan Thiết' },
    { name: 'Hòn Rơm 1 Resort', address: 'Long Sơn, Mũi Né, Phan Thiết' },
    { name: 'Khách sạn khác', address: '', _isOther: true }
];