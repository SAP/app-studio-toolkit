
export function getProjectServices() {
	return {
		capsrv: {
			uri: "myproject/srv/service.cds",
			name: "capsrv",
			ref: "/service/capsrv",
			entitySets: {
				Function1: {
					uri: "myproject/srv/service.cds",
					name: "Function1",
					ref: "capsrv.Function1",
					serviceEntityRef: "/service/capsrv/Function1",
					attributes: {
					},
					isViewEntity: true,
					serviceName: "capsrv",
					isExternal: false,
					entityName: "",
					hasRestriction: true,
					type: "ServiceEntitySet",
					relatedArtifacts: [
					],
					hasBusinessLogic: false,
					namespace: "",
					logicInfo: {
						type: "Function",
					},
				},
				Action1: {
					uri: "myproject/srv/service.cds",
					name: "Action1",
					ref: "capsrv.Action1",
					serviceEntityRef: "/service/capsrv/Action1",
					attributes: {
					},
					isViewEntity: true,
					serviceName: "capsrv",
					isExternal: false,
					entityName: "",
					hasRestriction: false,
					type: "ServiceEntitySet",
					relatedArtifacts: [
					],
					hasBusinessLogic: false,
					namespace: "",
					logicInfo: {
						type: "Action",
					},
				},
			},
			namespaces: {
			},
			path: "/service/capsrv",
			hasRestriction: true,
			type: "Service",
			relatedArtifacts: [
			],
		}
	};
}
