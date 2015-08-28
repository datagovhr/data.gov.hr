# ODI Open Data Certificates extension

This extension provides a mechanism for retrieving information about [Open Data Certificates](https://certificates.theodi.org/) so that the information can be included on the dataset page.

There are no templates supplied with this extension, but you can use the template helpers to integrate the information into your own templates.

## Installation

1. Active your virtualenv
2. Go to where you install your extensions
3. ```git clone https://github.com/datagovuk/ckanext-certificates.git```
4. ```cd ckanext-certificates```
5. ```python setup.py develop```

## Configuration

You should add ```certificates``` to your list of plugins configured by ```ckan.plugins```.

No other configuration is required by this extension but you should ensure your ```ckan.site_url``` is configured correctly so that matching entries can be found from the data feed.

## Retrieving information

You should set up a recurring task to fetch the certificates at a rate that is sensible.  To run the task as a one-off:

```
paster --plugin=ckanext-certificates fetch_certs -c <PATH_TO_CONFIG_FILE>
```