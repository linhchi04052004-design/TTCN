export const mockCategories = [
  { id: 'all', name: 'Tất cả' },
  { id: 'com-ga', name: 'Cơm gà' },
  { id: 'com-bo', name: 'Cơm bò' },
  { id: 'com-heo', name: 'Cơm xá xíu' },
  { id: 'do-uong', name: 'Đồ uống' },
];

export const mockMenu = [
  {
    id: '1',
    categoryId: 'com-ga',
    name: 'Cơm thố gà quay',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    description: 'Cơm thố nóng hổi với đùi gà quay giòn rụm, kèm xì dầu nấm hương đặc biệt.',
    note: 'Ngon hơn khi dùng kèm canh rong biển.'
  },
  {
    id: '2',
    categoryId: 'com-bo',
    name: 'Cơm thố bò xào',
    price: 50000,
    image: 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    description: 'Thịt bò mềm xào hành tây đậm đà trên thố cơm trắng.',
  },
  {
    id: '3',
    categoryId: 'com-heo',
    name: 'Cơm thố xá xíu',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1627308595229-7830f5c92f9f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    description: 'Thịt xá xíu mềm thơm mọng nước, ăn kèm cơm thố và dưa leo.',
  },
  {
    id: '4',
    categoryId: 'com-ga',
    name: 'Cơm thố đùi gà xối mỡ',
    price: 48000,
    image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    description: 'Đùi gà xối mỡ giòn da ngọt thịt, ăn cực cuốn.',
  },
  {
    id: '5',
    categoryId: 'do-uong',
    name: 'Trà đá',
    price: 5000,
    image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    description: 'Trà đá giải nhiệt.',
  }
];
