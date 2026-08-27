---
title: magic.lambda.xml
---

This project provides XML helper slots for Hyperlambda. More specifically, it provides the following slots.

* __[xml2lambda]__ - Creates a lambda object out of an XML input string
* __[lambda2xml]__ - Creates an XML string from a lambda object

## How to use [xml2lambda]

```
.xml:@"<CATALOG>
  <PLANT>
    <COMMON>Bloodroot</COMMON>
    <BOTANICAL>Sanguinaria canadensis</BOTANICAL>
    <ZONE>4</ZONE>
    <LIGHT>Mostly Shady</LIGHT>
    <PRICE>$2.44</PRICE>
    <AVAILABILITY>031599</AVAILABILITY>
  </PLANT>
</CATALOG>
"
xml2lambda:x:@.xml
```

The above results in something resembling the following.

```
xml2lambda
   CATALOG
      PLANT
         COMMON
            #text:Bloodroot
         BOTANICAL
            #text:Sanguinaria canadensis
         ZONE
            #text:4
         LIGHT
            #text:Mostly Shady
         PRICE
            #text:$2.44
         AVAILABILITY
            #text:031599
```

Attributes starts out with the `@` character, children nodes does not - While text content inside of elements will
be named `#text`. This implies you'll need to use escaped expression iterators when traversing the resulting node
lambda object. For instance, to retrieve the above `PRICE` element's inner text, you could use something such as the
following.

```
get-value:x:@xml2lambda/**/PRICE/*/\#text
```

## How to use [lambda2xml]

To convert from a lambda object to an XML object you can use something such as follows.

```
.xml
   CATALOG
      PLANT
         COMMON
            #text:Bloodroot
         BOTANICAL
            #text:Sanguinaria canadensis
         ZONE
            #text:4
         LIGHT
            #text:Mostly Shady
         PRICE
            #text:$2.44
         AVAILABILITY
            #text:031599
lambda2xml:x:@.xml/*
```

