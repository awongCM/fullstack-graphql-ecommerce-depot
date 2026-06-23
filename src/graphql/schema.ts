export const typeDefs = `#graphql
  type Product {
    id: ID!
    name: String!
    description: String!
    price: Float!
    imageUrl: String
    stock: Int!
  }

  type CartItem {
    id: ID!
    product: Product!
    quantity: Int!
    lineTotal: Float!
  }

  type Cart {
    id: ID!
    items: [CartItem!]!
    total: Float!
    itemCount: Int!
  }

  type CheckoutResult {
    success: Boolean!
    orderId: ID!
    message: String!
    total: Float!
  }

  type Query {
    products: [Product!]!
    product(id: ID!): Product
    cart(cartId: ID!): Cart!
  }

  type Mutation {
    addToCart(cartId: ID!, productId: ID!, quantity: Int): Cart!
    updateCartItem(cartItemId: ID!, quantity: Int!): Cart!
    removeFromCart(cartItemId: ID!): Cart!
    checkout(cartId: ID!): CheckoutResult!
  }
`;
