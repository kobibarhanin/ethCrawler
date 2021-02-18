
MAX_RESULTS = 30;

async function getRelatedAddresses(address) {
    res = await fetch(`https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=${token}`)
    rv = await res.json();
    return rv;
}

async function populate(source) {

    rv = await getRelatedAddresses(source);
    eff_rv = rv.result.slice(0, MAX_RESULTS);

    // populate the textarea
    $("#context_data").val(JSON.stringify(rv.result, null, 4))

    nodesSet = new Set();   
    eff_rv.forEach((item, index)=>{
      nodesSet.add(item.from);
      nodesSet.add(item.to);
    })

    nodesData = []
    nodesSet.forEach((item, index)=>{
      label = item.slice(0,5);
      image = ''
      if (known_addresses[item] !== undefined) {
        label = known_addresses[item]['title'];
        type = known_addresses[item]['type'];
        image = `./assets/${type}.png`
      } else {
        image = `./assets/unknown.png`        
      }
      nodesData.push({ id: item, label: label, title: item, image: image, shape: 'image'})
    })

    var nodes = new vis.DataSet(nodesData);

    edgesData = []
    eff_rv.forEach((item, index)=>{
      edgesData.push({ from:item.from, to: item.to, arrowhead:'normal', title: item.hash});
    })

    // create an array with edges
    var edges = new vis.DataSet(edgesData);

    // create a network
    var container = document.getElementById("mynetwork");
    var data = {
      nodes: nodes,
      edges: edges,
    };
    var options = {
      nodes: {
        // shape: 'box',
        font: { color: "#eeeeee" },
      },
      interaction: { hover: true },
      // manipulation: { enabled: true },
      physics: {
        barnesHut: { gravitationalConstant: -30000 },
        stabilization: { iterations: 2500 },
      },
      edges: {
        length: 300,
        arrows: 'middle' 
        // arrows: 'to',
        // arrowStrikethrough: false,
      },
      layout: {
        randomSeed: undefined,
        improvedLayout:true,
        clusterThreshold: 150,
        // hierarchical: {
        //   direction: 'UD',
        // }
      }
    };
    var network = new vis.Network(container, data, options);

    // to create click events
    network.on("click", function (params) {
      console.log(params);
      if (params.nodes.length > 0){
        populate(params.nodes[0]);
      }
    });

}

$("#source_form").submit(function(){
    event.preventDefault();
    var address = $("#source_address").val();
    populate(address);
});


populate(default_source);