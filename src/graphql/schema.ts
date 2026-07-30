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

  type PaymentIntent {
    paymentId: ID!
    clientSecret: String!
    amount: Float!
    currency: String!
    status: String!
    orderId: ID!
  }

  type CheckoutResult {
    success: Boolean!
    orderId: ID!
    message: String!
    total: Float!
    paymentStatus: String!
    failureCode: String
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
    createPaymentIntent(cartId: ID!): PaymentIntent!
    confirmPayment(
      paymentId: ID!
      paymentMethodId: String
      cardNumber: String
    ): CheckoutResult!
  }
`;
