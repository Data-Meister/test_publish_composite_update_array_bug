Container = new Mongo.Collection("Container");
subContainer = new Mongo.Collection("subContainer");

Items = new Mongo.Collection("Items");

if (Meteor.isClient) {
    ItemsThroughSecondLevelPublish = new Mongo.Collection("ItemsThroughSecondLevelPublish");
    ItemsThroughThirdLevelPublish = new Mongo.Collection("ItemsThroughThirdLevelPublish");

    Meteor.subscribe("items");
    Session.set('counter', 0);

    Template.hello.helpers({
        counter: function () {
            return Session.get('counter');
        },
        items: function () {
            return {
                ItemsThroughSecondLevelPublish: ItemsThroughSecondLevelPublish.find(),
                ItemsThroughThirdLevelPublish: ItemsThroughThirdLevelPublish.find()
            };
        },
        container: function () {
            return Container.findOne();
        }
    });

    Template.hello.events({
        'click button': function () {
            // increment the counter when button is clicked
            Session.set('counter', Session.get('counter') + 1);
            var item_id = Items.insert({title: "item " + Session.get('counter')});
            var c = Container.findOne();
            Container.update(c._id, {$push: {item_ids: item_id}});
        }
    });
}

if (Meteor.isServer) {
    Meteor.startup(function () {

        Container.remove({});
        subContainer.remove({});
        Items.remove({});

        Container.insert({item_ids: []});
        subContainer.insert({});
    });


    Meteor.publishComposite("items", function () {

        return {
            find: function () {
                return Container.find();
            },
            children: [
                {
                    find: function (container) {
                        return subContainer.find();
                    },
                    children: [
                        {
                            collectionName: "ItemsThroughThirdLevelPublish",
                            find: function (subcontainer, container) {
                                var item_ids = container.item_ids || [];
                                console.log("item_ids.length", item_ids.length);
                                return Items.find({_id: {$in: item_ids}});
                            }
                        }
                    ]
                },
                {
                    collectionName: "ItemsThroughSecondLevelPublish",
                    find: function (container) {
                        var item_ids = container.item_ids || [];
                        console.log("item_ids.length", item_ids.length);
                        return Items.find({_id: {$in: item_ids}});
                    }
                }
            ]
        };
    })
}
