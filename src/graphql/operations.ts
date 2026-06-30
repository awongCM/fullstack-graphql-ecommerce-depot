import { gql } from "@apollo/client";

export const PRODUCT_FIELDS = gql`
  fragment ProductFields on Product {
    id
    name
    description
    price
    imageUrl
    stock
  }
`;

export const CART_FIELDS = gql`
  fragment CartFields on Cart {
    id
    total
    itemCount
    items {
      id
      quantity
      lineTotal
      product {
        ...ProductFields
      }
    }
  }
  ${PRODUCT_FIELDS}
`;

export const GET_PRODUCTS = gql`
  query GetProducts {
    products {
      ...ProductFields
    }
  }
  ${PRODUCT_FIELDS}
`;

export const GET_PRODUCT = gql`
  query GetProduct($id: ID!) {
    product(id: $id) {
      ...ProductFields
    }
  }
  ${PRODUCT_FIELDS}
`;

export const GET_CART = gql`
  query GetCart($cartId: ID!) {
    cart(cartId: $cartId) {
      ...CartFields
    }
  }
  ${CART_FIELDS}
`;

export const ADD_TO_CART = gql`
  mutation AddToCart($cartId: ID!, $productId: ID!, $quantity: Int) {
    addToCart(cartId: $cartId, productId: $productId, quantity: $quantity) {
      ...CartFields
    }
  }
  ${CART_FIELDS}
`;

export const UPDATE_CART_ITEM = gql`
  mutation UpdateCartItem($cartItemId: ID!, $quantity: Int!) {
    updateCartItem(cartItemId: $cartItemId, quantity: $quantity) {
      ...CartFields
    }
  }
  ${CART_FIELDS}
`;

export const REMOVE_FROM_CART = gql`
  mutation RemoveFromCart($cartItemId: ID!) {
    removeFromCart(cartItemId: $cartItemId) {
      ...CartFields
    }
  }
  ${CART_FIELDS}
`;

export const CHECKOUT = gql`
  mutation Checkout($cartId: ID!) {
    checkout(cartId: $cartId) {
      success
      orderId
      message
      total
    }
  }
`;
