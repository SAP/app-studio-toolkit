namespace orders;

using { bookshop.Books } from './schema';

entity Suppliers
{
    key ID : UUID;
    name : String(100);
    address : String(100);
    orders : Association to many Orders on orders.supplier = $self;
}

entity Orders
{
    key ID : UUID;
    books : Association to one Books;
    customer : Association to one Customers;
    supplier : Association to one Suppliers;
}

entity Customers
{
    key ID : UUID;
    name : String(100);
    address : String(100);
    phone_number : Integer;
    orders : Association to many Orders on orders.customer = $self;
}
