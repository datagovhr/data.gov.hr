import re

# Map: Database entry -> Displayname
# Ensure this agrees with themes.json
THEMES = {
    u"Health": u"Health",
    u"Environment": u"Environment",
    u"Education": u"Education",
    u"Crime": u"Crime & Justice",
    u"Government": u"Government",
    u"Defence": u"Defence",
    u"Economy": u"Business & Economy",
    u"Transport": u"Transport",
    u"Spending": u"Government Spending",
    u"Society": u"Society",
    u"Mapping": u"Mapping",
    u"Towns": u"Towns & Cities",
}


government_depts_raw = """
Attorney General's Office
Cabinet Office
Central Office of Information
Charity Commission for England and Wales
Commissioners for the Reduction of the National Debt
Crown Estate
Crown Prosecution Service
Department for Business, Innovation and Skills
Department for Children, Schools and Families
Department for Communities and Local Government
Department for Culture, Media and Sport
Department for Education
Department for Environment, Food and Rural Affairs
Department for International Development
Department for Transport
Department for Work and Pensions
Department of Energy and Climate Change
Department of Health
Export Credits Guarantee Department
Food Standards Agency
Foreign and Commonwealth Office
Forestry Commission
Government Actuary's Department
Government Equalities Office
Her Majesty's Revenue and Customs
Her Majesty's Treasury
Home Office
Ministry of Defence
Ministry of Justice
National School of Government
Northern Ireland Office
Office for Standards in Education, Children's Services and Skills
Office of Fair Trading
Office of Gas and Electricity Markets
Office of Rail Regulation
Office of the Advocate General for Scotland
Office of the Leader of the House of Commons
Office of the Leader of the House of Lords
Office of the Parliamentary Counsel
Postal Services Commission
Public Works Loan Board
Revenue and Customs Prosecutions Office
Scotland Office
Serious Fraud Office
Treasury Solicitor's Department
UK Statistics Authority
UK Trade & Investment
Wales Office
Water Services Regulation Authority

Scottish Government
Welsh Assembly Government
Northern Ireland Executive
"""
government_depts = []
for line in government_depts_raw.split('\n'):
    if line:
        government_depts.append(unicode(line.strip()))

organisation_name_mapping = {
    'DCSF':'Department for Children, Schools and Families',
    'VLA':'Vetinary Laboratories Agency',
    'MFA':'Marine and Fisheries Agency',
    'CEFAS':'Centre of Environment, Fisheries and Aquaculture Science',
    'FERA':'Food and Environment Research Agency',
    'DEFRA':'Department for Environment, Food and Rural Affairs',
    'Department for the Environment, Food and Rural Affairs':'Department for Environment, Food and Rural Affairs',
    'CRB':'Criminal Records Bureau',
    'UKBA':'UK Border Agency',
    'IPS':'Identity and Passport Service',
    'NPIA':'National Policing Improvement Agency',
    'CIB':'Company Investigation Branch',
    'IPO':'Intellectual Property Office',
    'SFO':'Serious Fraud Office',
    'HM Revenue and Customs':"Her Majesty's Revenue and Customs",
    'HM Treasury':"Her Majesty's Treasury",
    'DfT':'Department for Transport',
    'socitm':'Society of Information Technology Management',
    'Communities and Local government':'Department for Communities and Local Government',
    'Department of Communities and Local Government':'Department for Communities and Local Government',
    'Department for Education (DfE)':'Department for Education',
    'HM Customs and Revenue':"Her Majesty's Revenue and Customs",
    'Business, Innovation and Skills':'Department for Business, Innovation and Skills',
    'Communities and Local Government':'Department for Communities and Local Government',
    'Culture, Media and Sport':'Department for Culture, Media and Sport',
    'Defence':'Ministry of Defence',
    'Education':'Department for Education',
    'Energy and Climate Change':'Department of Energy and Climate Change',
    'Enterprise, Trade and Investment (Northern Ireland)':'Department of Enterprise Trade and Investment',
    'Environment, Food and Rural Affairs':'Department for Environment, Food and Rural Affairs',
    'Health':'Department of Health',
    'ISD Scotland (part of NHS National Services Scotland)':'ISD Scotland',
    'Information Centre for Health and Social Care':'Health and Social Care Information Centre',
    'Health and Social Care Information Centre':'Health and Social Care Information Centre',
    'International Development':'Department for International Development',
    'Justice':'Ministry of Justice',
    'National Treatment Agency':'National Treatment Agency for Substance Misuse',
    'Transport':'Department for Transport',
    'Work and Pensions':'Department for Work and Pensions',
    'Culture, Arts and Leisure (Northern Ireland)':'Department of Culture, Arts and Leisure',
    'Employment and Learning (Northern Ireland)':'Department for Employment and Learning',
    'Office of the First Minister and deputy First Minister (Northern Ireland)':'Office of the First Minister and deputy First Minister',
    'Finance and Personnel (Northern Ireland)':'Department of Finance and Personnel',
    'Regional Development (Northern Ireland)':'Department for Regional Development',
    'Education (Northern Ireland)':'Department of Education',
    'Environment (Northern Ireland)':'Department of the Environment',
    'Health, Social Service and Public Safety (Northern Ireland)':'Department of Health, Social Services and Public Safety',
    'Health, Social Services and Public Safety (Northern Ireland)':'Department of Health, Social Services and Public Safety',
    'Agriculture and Rural Development (Northern Ireland)':'Department of Agriculture and Rural Development',
    'Social Development (Northern Ireland)':'Department for Social Development',
    'Department of Justice (Northern Ireland)':'Department of Justice',
    'Justice (Northern Ireland)':'Department of Justice',
    'National Health Service in Scotland':'NHS Scotland',
    'Police Service of Northern Ireland (PSNI)':'Police Service of Northern Ireland',
    'Office for Rail Regulation':'Office of Rail Regulation',
    'Welsh Assembly Government':'Welsh Government',
    'Cancer Registry (Northern Ireland)':'Northern Ireland Cancer Registry',
    'Cancer Registry Northern Ireland':'Northern Ireland Cancer Registry',
    }

update_frequency_options = ['never', 'discontinued', 'annual', 'quarterly', 'monthly']

geographic_granularity_options = ['national', 'regional', 'local authority', 'ward', 'point']

temporal_granularity_options = ['year', 'quarter', 'month', 'week', 'day', 'hour', 'point']

category_options = ['Agriculture and Environment', 'Business and Energy', 'Children, Education and Skills', 'Crime and Justice', 'Economy', 'Government', 'Health and Social Care', 'Labour Market', 'People and Places', 'Population', 'Travel and Transport', 'Equality and Diversity', 'Migration']

region_options = ('England', 'Scotland', 'Wales', 'Northern Ireland', 'Overseas', 'Global')

region_groupings = {'United Kingdom':['England', 'Scotland', 'Wales', 'Northern Ireland'], 'Great Britain':['England', 'Scotland', 'Wales']}

region_abbreviations = {'UK':'United Kingdom', 'N. Ireland':'Northern Ireland', 'GB':'Great Britain'}

tag_pool = ['accident', 'road', 'traffic', 'health', 'illness', 'disease', 'population', 'school', 'accommodation', 'children', 'married', 'emissions', 'benefit', 'alcohol', 'deaths', 'mortality', 'disability', 'unemployment', 'employment', 'armed forces', 'asylum', 'cancer', 'births', 'burglary', 'child', 'tax credit', 'criminal damage', 'drug', 'earnings', 'education', 'economic', 'fire', 'fraud', 'forgery', 'fuel', 'green', 'greenhouse gas', 'homeless', 'hospital', 'waiting list', 'housing', 'care', 'income', 'census', 'mental health', 'disablement allowance', 'jobseekers allowance', 'national curriculum', 'older people', 'living environment', 'higher education', 'living environment', 'school absence', 'local authority', 'carbon dioxide', 'energy', 'teachers', 'fostering', 'tide', 'gas', 'electricity', 'transport', 'veterinary', 'fishing', 'export', 'fisheries', 'pest', 'recycling', 'waste', 'crime', 'anti-social behaviour', 'police', 'refugee', 'identity card', 'immigration', 'planning', 'communities', 'lettings', 'finance', 'ethnicity', 'trading standards', 'trade', 'business', 'child protection', 'jobs', 'weather', 'climate', 'rainfall', 'cloud', 'snow', 'humidity', 'pressure', 'precipitation', 'sunshine', 'frost', 'temperature', 'fish']

tag_search_fields = ['name', 'title', 'notes', 'categories', 'agency']

tag_words_to_join = ['ordnance survey', 'environmental protection', 'water conservation', 'water resources', 'water quality', 'climate and weather', 'nature conservation', 'waste management', 'waste policies and regulation', 'air quality', 'tariff codes', 'life stages', 'dry days']

def name_munge(name):
    # convert spaces to underscores
    name = re.sub(' ', '_', name).lower()        
    # convert symbols to dashes
    name = re.sub('[:]', '_-', name)
    name = re.sub('[/]', '-', name)
    # take out not-allowed characters
    name = re.sub('[^a-zA-Z0-9-_]', '', name)
    # remove double underscores
    name = re.sub('__', '_', name)
    # fix up things like "_-_"
    name = re.sub("_-_", "-", name)
    return name[:100]

def tag_munge(name):
    '''munges a name to be suitable for a tag'''
    return name_munge(name).replace('_', '-').replace('--', '-').replace("_-_", "-")

class TagSuggester(object):
    @classmethod
    def suggest_tags(cls, pkg_dict):
        tags = set()
        for field_name in tag_search_fields:
            if pkg_dict.has_key(field_name):
                text = pkg_dict[field_name]
            else:
                if pkg_dict.has_key('extras'):
                    text = pkg_dict['extras'].get(field_name)
            if text and isinstance(text, (str, unicode)):
                text_lower = text.lower()
                for keyword in tag_pool:
                    if keyword in text_lower:
                        tags.add(tag_munge(keyword))
        return tags

suggest_tags = TagSuggester.suggest_tags

def tags_parse(tags_str):
    '''Takes a string containing tags and returns a list of tag names.
    Takes into account tag_words_to_join. Ensures tags are munged.'''
    tags_str = tags_str.lower()
    for phrase in tag_words_to_join:
        if phrase in tags_str:
            tags_str = tags_str.replace(phrase, tag_munge(phrase))
    tag_list = re.split(',\s*|\s+', tags_str.strip())
    return [tag_munge(tag_name) for tag_name in tag_list]

    
class GeoCoverageType(object):
    @staticmethod
    def get_instance():
        if not hasattr(GeoCoverageType, 'instance'):
            GeoCoverageType.instance = GeoCoverageType.Singleton()
        return GeoCoverageType.instance

    class Singleton(object):
        def __init__(self):
            regions_str = region_options
            self.groupings = region_groupings
            self.regions = [(region_str, GeoCoverageType.munge(region_str)) for region_str in regions_str]
            self.regions_munged = [GeoCoverageType.munge(region_str) for region_str in regions_str]

        def munged_regions_to_printable_region_names(self, munged_regions):
            incl_regions = []
            for region_str, region_munged in self.regions:
                if region_munged in munged_regions:
                    incl_regions.append(region_str)
            for grouping_str, regions_str in self.groupings.items():
                all_regions_in = True
                for region_str in regions_str:
                    if region_str not in incl_regions:
                        all_regions_in = False
                        break
                if all_regions_in:
                    for region_str in regions_str:
                        incl_regions.remove(region_str)
                    incl_regions.append('%s (%s)' % (grouping_str, ', '.join(regions_str)))
            return ', '.join(incl_regions)

        def str_to_db(self, regions_str):
            for abbrev, region in region_abbreviations.items():
                regions_str = regions_str.replace(abbrev, region)
            for grouping, regions in region_groupings.items():
                regions_str = regions_str.replace(grouping, ' '.join(regions))
            regions_munged = []
            for region, region_munged in self.regions:
                if region in regions_str:
                    regions_munged.append(region_munged)
            return self.form_to_db(regions_munged)

        def form_to_db(self, form_regions):
            assert isinstance(form_regions, list)
            coded_regions = u''
            for region_str, region_munged in self.regions:
                coded_regions += '1' if region_munged in form_regions else '0'
            regions_str = self.munged_regions_to_printable_region_names(form_regions)
            return '%s: %s' % (coded_regions, regions_str)

        def db_to_form(self, form_regions):
            '''
            @param form_regions e.g. 110000: England, Scotland
            @return e.g. ["england", "scotland"]
            '''
            regions = []
            if len(form_regions)>len(self.regions):
                for i, region in enumerate(self.regions):
                    region_str, region_munged = region
                    if form_regions[i] == '1':
                        regions.append(region_munged)
            return regions

    @staticmethod
    def munge(region):
        return region.lower().replace(' ', '_')

    @staticmethod
    def strip_off_binary(coverage):
        '''e.g. "110000: England and Wales" -> "England and Wales"'''
        if not ':' in coverage:
            return coverage
        binary, words = coverage.split(':')
        return words.strip()

    def __getattr__(self, name):
        return getattr(self.instance, name)

def canonise_organisation_name(org_name):
    '''Takes a variant on an organisation name and returns the canonical
    name, which should match what is in DGU.'''
    if not org_name:
        return org_name
    canonised_name = organisation_name_mapping.get(org_name.strip()) or org_name
    return canonised_name


