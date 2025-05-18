using { cap as my } from '../db/schema.cds';

@path : '/service/capsrv'
service capsrv
{
    action Action1
    (
    );

    function Function1
    (
    )
    returns String;
}

annotate capsrv with @requires :
[
    'authenticated-user'
];
