
@javascript
Feature: Create a Library Resource and search for library resources
  In order to easily find and create a library resource
  As a site user
  I should be able to search from a library search page, where I can create a new Library resource

  @anon @search
  Scenario: View the library landing page and check default search result sort by option
    Given I am on the homepage
    And I click "Interact"
    When I follow "Library"
    Then I should be on "/library"
    And I should see the following <breadcrumbs>
      | Library |
    And "Library" item in "Interact" subnav should be active
    And "Last updated" option in "Sort by:" should be selected


  @anon @search
  Scenario: Use search box on Library landing page and search results page with and without a keyword to check the error message and solr sort.
    Given I am on "/library"
    And I click search icon
    Then I should see "Please enter some keywords to refine your search further."
    And I should be on "/search/everything/?f[0]=bundle%3Aresource"
    And "Author" option in "Sort by:" should be disabled
    And "Relevance" option in "Sort by:" should be disabled
    And I should see "DOCUMENT TYPE" pane in "first" column in "first" row
    And I should see "CATEGORY" pane in "first" column in "first" row
    And I should see "SECTOR" pane in "first" column in "first" row
    And I should see "TAGS" pane in "first" column in "first" row
    When I fill in "Search library resources..." with "data"
    And I click search icon
    Then I should be on "/search/everything/data?f[0]=bundle%3Aresource&solrsort=score"
    And I should see the following <breadcrumbs>
      | Search |
    And "Relevance" option in "Sort by:" should be selected
    And "Author" option in "Sort by:" should be disabled
    And there should be "10" search results on the page
    And I should see "CONTENT TYPE" pane in "first" column in "first" row
    And I should see "CATEGORY" pane in "first" column in "first" row
    And I should see "DOCUMENT TYPE" pane in "first" column in "first" row
    And I should see "SECTOR" pane in "first" column in "first" row
    And I should see "TAGS" pane in "first" column in "first" row
    And search result counter should match "^\d* Library resources$"
    And pager should match "^1 2 3 … »$"

  @api
  Scenario: Create a new library resource as the "test_user" and then update it.
    Given that the user "test_user" is not registered
    And I am logged in as a user "test_user" with the "administrator" role
    When I visit "/admin/workbench/create"
    And I follow "Library resource"
    And I wait until the page loads
    Then I should see "Create Library resource"
    Given I have an image "300" x "300" pixels titled "Test image" located in "/tmp/" folder
    And I attach the file "/tmp/Test image.png" to "files[field_resource_file_und_0]"
    And I fill in "Title" with "Test Library resource"
    And I type "Test Library resource description text" in the "edit-body-und-0-value" WYSIWYG editor
    And I check the box "Health"
    And I fill in "Tags" with "Test"
    And I select "Public sector" from "Sector"
    And I select "Guidance" from "Document Type"
    When I press "Save"
    And I wait until the page loads
    Then I should see "The selected file Test image.png cannot be uploaded. Only files with the following extensions are allowed: pdf, txt, rtf, csv, odt, ods, odp, odg, odf, doc, docx, xls, xlsx, ppt."
    Given I have a txt file titled "Test file" located in "/tmp/" folder
    And I attach the file "/tmp/Test file.txt" to "files[field_resource_file_und_0]"
    When I press "Save"
    Then I should see "Library resource Test Library resource has been created."
    And I should see node title "Test Library resource"
    And I should see "Submitted on"
    And I should see "Test Library resource description text"
    When I follow "Edit"
    And I wait until the page loads
    And I press "Save"
    Then I should see "Library resource Test Library resource has been updated."
    And I should see the following <breadcrumbs>
      | Library               |
      | Test Library resource |
    And I should see "updated on"

#TODO use editor role instead of adminsitrator when creating a Test library resource.
