const request = require('request');

const INDUSTRY_STANDARD_FACTOR = 250
const CATEGORY = "Air Conditioners"
const BASE_URL = 'http://wp8m3he1wt.s3-website-ap-southeast-2.amazonaws.com'
/**
 * A promise that recursively requests products until a pagination limit is reached.
 * 
 * @param {string} uri The endpoint of the product api to perform a GET request
 * @param {array} products An array of objects that will represent the products
 * @param {array} filters An array of filter objects that can be used to filter
 *  */ 
const getProducts = (uri, products, filters) => {
    return new Promise((resolve, reject) => {
        request(uri, async (error, response, body) => {
            if(error) {
                console.log(error)
                reject(error)
            } else {
                body = JSON.parse(body)
                //apply filter to retuned products and append them to the current products found
                products = products.concat(filterProducts(body.objects, filters))

                //if another page call self else resolve promise and return products found
                if(body.next !== null) {
                    resolve(getProducts(`${BASE_URL}${body.next}`, products, filters))
                } else {
                    resolve(products)
                }
            }
        })
    })
}
/**
 * Filter array of products using filter objects passed to the function
 * 
 * @param {array} products Array of product to be filtered
 * @param {array} filters An array of of filter objects. A filter must have type, key and value e.g {type: "equalTo"; key: "category"; value: "Shoes"}
 *  */ 
const filterProducts = (products, filters) => {
    if(filters && filters.length > 0) {
        filters.forEach(filter =>  {
            products = products.filter(product => {
                if(filter.type == "equalTo") return product[filter.key] == filter.value; 
                else if(filter.type == "range") return filter.value[0] <= product[filter.key] && product[filter.key] <= filter.value[1]; 
            })
        })
    }
    return products;
}
/**
 * Returns all products in the category Air Conditioners
 *  */ 
const gatherAirCons = async () => {  
    let products = await getProducts(`${BASE_URL}/api/products/1`, [], 
                [{
                    type: "equalTo",
                    key: "category",
                    value: CATEGORY
                },
                //Originally misread the challenge and assumed that the product titled "Window Seal for Portable Air Conditioner Outlets"
                //was not counted as an air conditioner, leading me to build this filter functionality. After re-reading I realised that
                //the challenge was to "find the average cubic weight for ALL products in the "Air Conditioners" category."
                //Below is a weight range filter to filter out very light products and very heavy products.
                // {
                //     type: "range",
                //     key: "weight",
                //     value: [25000 * 0.5, 25000 * 1.5]
                // }
                ])
    console.log(`\nFound ${products.length} products in the ${CATEGORY} category\n`)
    return products
}
/**
 * Returns cubic weight of a product passed in and multpies it by a conversation factor
 * @param {object} product A product with a size object
 * @param {number} conversionFactor
 *  */ 
const getCubicWeight = (product, conversionFactor) => {
    return (product.size.width / 100) * (product.size.height/ 100) * (product.size.length / 100) * conversionFactor
}

const main = async () =>{
    //get all products in air conditioner category
    let products = await gatherAirCons();
    if (products && products.length > 0)
    {
        //assign cubic weight to all products
        products.forEach(product => {
            product.cubicWeight = getCubicWeight(product, INDUSTRY_STANDARD_FACTOR)
        })

        //find the total cubic weight
        const totalCubicWeight = products.reduce((total, product) => total + product. cubicWeight, 0);
        //find and display the average cubic weight
        console.log(`The average cubic weight for all products in the "${CATEGORY}" category is ${totalCubicWeight/ products.length}kg\n`)
    }
}

main()