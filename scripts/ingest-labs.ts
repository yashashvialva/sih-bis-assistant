import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const LABS_DATA = [
  {
    name: 'TUV Rheinland (India) Pvt. Ltd.',
    address: '27/B, 2nd Cross, Electronic City Phase 1, Bangalore',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560100',
    laboratory_type: 'Private',
    latitude: 12.8468,
    longitude: 77.6625,
    accreditation_number: 'TC-5390',
    contact: '080-67233500',
    website: 'https://www.tuv.com/india/en/',
    source_url: 'https://lims.bis.gov.in/home/search_is_number/?is_number__doc_no=16102',
    source_type: 'BIS',
    verification_status: 'BIS_RECOGNIZED',
  },
  {
    name: 'Intertek India Pvt. Ltd. (Delhi)',
    address: 'E-20, Block B1, Mohan Cooperative Industrial Estate, Mathura Road, New Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110044',
    laboratory_type: 'Private',
    latitude: 28.5134,
    longitude: 77.2941,
    accreditation_number: 'TC-5120',
    contact: '011-41595460',
    website: 'https://www.intertek.com/india/',
    source_url: 'https://lims.bis.gov.in/home/search_is_number/?is_number__doc_no=16102',
    source_type: 'BIS',
    verification_status: 'BIS_RECOGNIZED',
  },
  {
    name: 'Electrical Research and Development Association (ERDA)',
    address: 'ERDA Road, Makarpura Industrial Estate, Vadodara',
    city: 'Vadodara',
    state: 'Gujarat',
    pincode: '390010',
    laboratory_type: 'Govt',
    latitude: 22.2530,
    longitude: 73.1979,
    accreditation_number: 'TC-5389',
    contact: '0265-3061111',
    website: 'https://www.erda.org/',
    source_url: 'https://lims.bis.gov.in/home/search_is_number/?is_number__doc_no=16102',
    source_type: 'BIS',
    verification_status: 'BIS_RECOGNIZED',
  },
  {
    name: 'UL India Pvt. Ltd.',
    address: 'Laboratory Building, Kalyani Platina Campus, Sy. No. 129, Kundalahalli Village, EPIP Zone, Whitefield, Bangalore',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560066',
    laboratory_type: 'Private',
    latitude: 12.9734,
    longitude: 77.7145,
    accreditation_number: 'TC-5011',
    contact: '080-41384400',
    website: 'https://india.ul.com/',
    source_url: 'https://lims.bis.gov.in/home/search_is_number/?is_number__doc_no=16102',
    source_type: 'BIS',
    verification_status: 'BIS_RECOGNIZED',
  },
  {
    name: 'National Test House (WR)',
    address: 'Plot No. F-10, MIDC Marol, Andheri (East), Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400093',
    laboratory_type: 'Govt',
    latitude: 19.1166,
    longitude: 72.8711,
    accreditation_number: 'TC-5433',
    contact: '022-28321033',
    website: 'https://nth.gov.in/',
    source_url: 'https://lims.bis.gov.in/home/search_is_number/?is_number__doc_no=16102',
    source_type: 'BIS',
    verification_status: 'BIS_RECOGNIZED',
  }
];

async function main() {
  console.log('Clearing existing laboratories...');
  await supabase.from('laboratories').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log(`Inserting ${LABS_DATA.length} genuine testing laboratories...`);
  const { data, error } = await supabase.from('laboratories').insert(LABS_DATA).select();

  if (error) {
    console.error('Error inserting laboratories:', error);
  } else {
    console.log('Successfully inserted laboratories!');
    console.log(data);
  }
}

main();
