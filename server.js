'use strict'

const Hapi = require('@hapi/hapi')
const axios = require('axios')
const path = require('path')
const init = async() => {
    const server = Hapi.server({
        host: 'localhost',
        port: 8000
    });

    await server.register([{
        plugin: require('@hapi/vision')
    }])

    server.views({
        engines: {
            hbs: require('handlebars')
        },
        path: path.join(__dirname, 'views'),
    })

    server.route([{
        // PART 1
        method: 'POST',
        path: '/pomelo',
        handler: (request, h) => {
            const payload = request.payload
            var result = []
            var payloadKeys = Object.keys(payload);
            var parentMap = {}
            for (let lvl = payloadKeys.length - 1; lvl > -1; lvl--){
                payload[lvl].forEach((ind) => {
                    if (ind["level"] == payloadKeys.length - 1){
                        if (parentMap[ind["parent_id"]]){
                            parentMap[ind["parent_id"]].push(ind)
                        }
                        else{
                            parentMap[ind["parent_id"]] = [ind]
                        }
                    } else if (ind["level"] > 0){
                        if (parentMap[ind["id"]]){
                            ind["children"] = parentMap[ind["id"]]
                        }
                        if (parentMap[ind["parent_id"]]){
                            parentMap[ind["parent_id"]].push(ind)
                        }
                        else{
                            parentMap[ind["parent_id"]] = [ind]
                        }
                    } else{
                        if (parentMap[ind["id"]]){
                            ind["children"] = parentMap[ind["id"]]
                        }
                        result.push(ind)
                    }
                })
            }
            return result
        }
    },{
        // PART 2
        method: 'GET',
        path: '/github-search',
        handler: async (request, h) => {
            const page = parseInt(request.query.page)
            const per_page = parseInt(request.query.per_page)
            const req = await axios({
                baseURL: `https://api.github.com`,
                url: `/search/repositories?q=nodejs&per_page=${per_page}&page=${page}`,
                headers: {
                    'User-Agent': 'request'
                },
                method: 'get'
            })
            const result = {
                next: page + 1,
                page: page,
                prev: page - 1,
                per_page: per_page,
                result: []
            }
            if (page == 1) {
                result.prev = page
            }
            if (page == 10) {
                result.next = page
            }
            var items = req.data.items
            items.forEach((item) => {
                result.result.push({"name": item.full_name, "url": item.html_url})
            })
            return h.view('index', result)
        }
    }]);

    await server.start()
    console.log(`Server started on: ${server.info.uri}`)
}

process.on('unhandledRejection', (err) => {
    console.log(err)
    process.exit(1)
})

init()