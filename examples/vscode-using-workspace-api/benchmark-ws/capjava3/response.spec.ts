import { Namespace, Service, UiApplication, UiApplicationType } from "../../../../../common/src/ProjectInterfaces";
export const CapBookshop = (): Namespace[] => [{
	"entities": {
		"Books": {
			"attributes": {
				"ID": {
					"kind": "Integer",
					"name": "ID"
				},
				"stock": {
					"kind": "Integer",
					"name": "stock"
				},
				"title": {
					"kind": "String",
					"name": "title"
				}
			},
			"external": false,
			"fromExternal": false,
			"isPdmItem": false,
			"isViewEntity": false,
			"name": "Books",
			"namespace": "my.bookshop",
			"projectedNamespaceName": "",
			"ref": "my.bookshop.Books",
			"relatedArtifacts": [
				{
					"ref": "db/data/my.bookshop-Books.csv",
					"relation": "HAS_DEPENDENCY",
					"type": "SampleData"
				},
			],
			"type": "NamespaceEntity",
			"uri": "myproject/db/data-model.cds",
		},
	},
	"hasEvent": false,
	"hasLogic": false,
	"isExternal": false,
	"isRfc": false,
	"attributes": undefined,
	"linkedNamespaces": {},
	"name": "my.bookshop",
	"ref": "my.bookshop",
	"relatedArtifacts": [],
	"type": "Namespace",
	"uri": "myproject/db/data-model.cds"
}
];

export const CapCatalogService = (): Service[] => [{
	"entitySets": {
		"Books": {
			"attributes": {
				"ID": {
					"kind": "Integer",
					"name": "ID"
				},
				"stock": {
					"kind": "Integer",
					"name": "stock"
				},
				"title": {
					"kind": "String",
					"name": "title"
				},
			},
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- for test
			//@ts-ignore 
			"entityName": "Books",
			"hasBusinessLogic": false,
			"hasRestriction": false,
			"isExternal": false,
			"isViewEntity": true,
			"name": "Books",
			"namespace": "my.bookshop",
			"ref": "my.bookshop.CatalogService.Books",
			"serviceEntityRef": "/catalog/Books",
			"relatedArtifacts": [],
			"serviceName": "CatalogService",
			"type": "ServiceEntitySet",
			"uri": "myproject/srv/cat-service.cds",
		},
	},
	"hasRestriction": false,
	"name": "CatalogService",
	"namespaces": {
		"my.bookshop": "my.bookshop",
	},
	"path": "/catalog",
	"ref": "/catalog",
	"relatedArtifacts": [],
	"type": "Service",
	"uri": "myproject/srv/cat-service.cds"

}
];

export const CapUIInfo = (): UiApplication<UiApplicationType>[] => [
]
