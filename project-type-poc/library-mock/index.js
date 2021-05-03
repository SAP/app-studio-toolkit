
class ProjectAPI {

    constructor(opts) {
        // TODO: How to fill the Project Data?
        //       How to make this portable?
        //       should some helper metadata exist on the file system?
        this.data = undefined
    }

    /**
     * @return {Promise<Project | undefined>}
     */
    async read() {
        return this.data
    }
}

class Project {
    /**
     * @param {object} opts
     * @param {string} opts.type
     * @param {string} opts.name
     * @param {string} opts.path
     * @param {string} opts.prefix
     * @param {string} opts.cloudService
     * @param {string[]} opts.tags
     * @param {Module[]} opts.modules
     */
    constructor(opts) {
        this.type = opts.type;
        this.name = opts.name;
        this.path = opts.path;
        this.prefix = opts.prefix;
        this.cloudService = opts.cloudService;
        this.tags = opts.tags;
        this.modules = opts.modules;
    }
}

class Item {
    /**
     * @param {object} opts
     * @param {string} opts.type
     * @param {string} opts.name
     * @param {string} opts.ref
     * @param {string} opts.path
     */
    constructor(opts) {
        this.type = opts.type;
        this.name = opts.name;
        this.ref = opts.ref;
        this.path = opts.path;
    }
}



module.exports = {

    /**
     * @returns {Promise<ProjectApi[]>}
     */
    getProjects() {

    },

    /**
     *
     * @param {Tag} tag
     *
     * @returns {Promise<ProjectApi[]>}
     */
    getProjectsByTags(tag) {

    }
}


