namespace bookshop;

entity Books
{
    key ID : UUID;
    title : String(100);
    price : Decimal;
    stock : Integer;
    author : Association to one Authors;
}

entity Authors
{
    key ID : UUID;
    name : String(100);
    books : Association to many Books on books.author = $self;
}
