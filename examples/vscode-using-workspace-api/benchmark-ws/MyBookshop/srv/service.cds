using { bookshop } from '../db/schema';

@path : '/service/MyBookshop'
service MyBookshop
{
    annotate Books with @restrict :
    [
        { grant : [ '*' ], to : [ 'authenticated-user' ] },
        { grant : [ 'UPDATE' ], to : [ 'Manager' ] }
    ];

    @odata.draft.enabled
    entity Books as
        projection on bookshop.Books;

    @odata.draft.enabled
    entity Authors as
        projection on bookshop.Authors;

    action sellBook
    (
        book_title : String(100),
        copies : Integer
    )
    returns Integer;
}

annotate MyBookshop with @requires :
[
    'authenticated-user',
    'Manager'
];

@path : '/service/MyBookshop'
service MyBookshop2
{
    @odata.draft.enabled
    entity Books as
        projection on bookshop.Books;

    @odata.draft.enabled
    entity Authors as
        projection on bookshop.Authors;

    action sellBook
    (
        book_title : String(100),
        copies : Integer
    )
    returns Integer;
}

annotate MyBookshop2 with @requires :
[
    'authenticated-user'
];
