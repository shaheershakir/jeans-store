/**
 * Seed customers — realistic Indian e-commerce profiles.
 * Tuples: [name, city, state, pincode]
 */
export const CUSTOMER_SEED: [string, string, string, string][] = [
  ['Aarav Sharma', 'Mumbai', 'Maharashtra', '400001'],
  ['Ananya Iyer', 'Bengaluru', 'Karnataka', '560001'],
  ['Rohan Mehta', 'Delhi', 'Delhi', '110001'],
  ['Priya Nair', 'Kochi', 'Kerala', '682001'],
  ['Vikram Singh', 'Jaipur', 'Rajasthan', '302001'],
  ['Sneha Kulkarni', 'Pune', 'Maharashtra', '411001'],
  ['Arjun Reddy', 'Hyderabad', 'Telangana', '500001'],
  ['Kavya Krishnan', 'Chennai', 'Tamil Nadu', '600001'],
  ['Aditya Chatterjee', 'Kolkata', 'West Bengal', '700001'],
  ['Ishita Bose', 'Kolkata', 'West Bengal', '700032'],
  ['Karan Malhotra', 'Chandigarh', 'Chandigarh', '160001'],
  ['Ritu Agarwal', 'Indore', 'Madhya Pradesh', '452001'],
  ['Nikhil Gupta', 'Noida', 'Uttar Pradesh', '201301'],
  ['Pooja Deshmukh', 'Nagpur', 'Maharashtra', '440001'],
  ['Siddharth Rao', 'Gurugram', 'Haryana', '122001'],
  ['Meera Pillai', 'Bengaluru', 'Karnataka', '560095'],
  ['Rahul Verma', 'Lucknow', 'Uttar Pradesh', '226001'],
  ['Tanvi Joshi', 'Ahmedabad', 'Gujarat', '380001'],
  ['Harsh Patel', 'Surat', 'Gujarat', '395001'],
  ['Divya Menon', 'Chennai', 'Tamil Nadu', '600042'],
  ['Aman Khanna', 'Delhi', 'Delhi', '110021'],
  ['Naina Kohli', 'Mumbai', 'Maharashtra', '400050'],
  ['Yash Thakur', 'Bhopal', 'Madhya Pradesh', '462001'],
  ['Riya Singhania', 'Jaipur', 'Rajasthan', '302017'],
  ['Manish Yadav', 'Ludhiana', 'Punjab', '141001'],
  ['Shreya Ghosh', 'Kolkata', 'West Bengal', '700019'],
  ['Abhishek Jain', 'Delhi', 'Delhi', '110085'],
  ['Neha Saxena', 'Indore', 'Madhya Pradesh', '452016'],
  ['Kunal Dutta', 'Pune', 'Maharashtra', '411014'],
  ['Sara Khan', 'Mumbai', 'Maharashtra', '400012'],
  ['Gaurav Bhatia', 'Gurugram', 'Haryana', '122002'],
  ['Aisha Sheikh', 'Hyderabad', 'Telangana', '500081'],
  ['Rohit Pawar', 'Nagpur', 'Maharashtra', '440010'],
  ['Madhuri Hegde', 'Bengaluru', 'Karnataka', '560034'],
  ['Vivek Anand', 'Chennai', 'Tamil Nadu', '600017'],
  ['Shruti Mishra', 'Lucknow', 'Uttar Pradesh', '226010'],
  ['Pranav Kulkarni', 'Pune', 'Maharashtra', '411027'],
  ['Anjali Bansal', 'Jaipur', 'Rajasthan', '302004'],
  ['Deepak Chauhan', 'Chandigarh', 'Chandigarh', '160022'],
  ['Isha Talwar', 'Ahmedabad', 'Gujarat', '380015'],
  ['Naveen Kumar', 'Bengaluru', 'Karnataka', '560076'],
  ['Sana Parveen', 'Hyderabad', 'Telangana', '500045'],
  ['Amit Trivedi', 'Mumbai', 'Maharashtra', '400027'],
  ['Pallavi Rao', 'Kochi', 'Kerala', '682024'],
  ['Rajat Chawla', 'Delhi', 'Delhi', '110034'],
  ['Nikita Rathi', 'Surat', 'Gujarat', '395007'],
  ['Varun Sethi', 'Gurugram', 'Haryana', '122003'],
  ['Swati Pandey', 'Bhopal', 'Madhya Pradesh', '462022'],
  ['Farhan Qureshi', 'Lucknow', 'Uttar Pradesh', '226012'],
  ['Ankita Shah', 'Ahmedabad', 'Gujarat', '380016'],
  ['Mohit Bansal', 'Chandigarh', 'Chandigarh', '160017'],
  ['Lakshmi Venkatesh', 'Chennai', 'Tamil Nadu', '600090'],
]

const EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'gmail.com']

export interface SeedCustomer {
  id: number
  name: string
  email: string
  phone: string
  city: string
  state: string
  pincode: string
  joinedAt: string
}

export function buildCustomers(rand: () => number, now: number): SeedCustomer[] {
  return CUSTOMER_SEED.map(([name, city, state, pincode], i) => {
    const first = name.split(' ')[0].toLowerCase()
    const last = name.split(' ')[1]?.toLowerCase() ?? 'customer'
    const email = `${first}.${last}${i % 5 === 0 ? String(i) : ''}@${EMAIL_DOMAINS[i % EMAIL_DOMAINS.length]}`
    const phone = `+91 9${String(8000000000 + Math.floor(rand() * 999999999) + i * 73).slice(0, 9)}`
    // Joined between 400 and 40 days ago
    const joinedDaysAgo = 40 + Math.floor(rand() * 360)
    return {
      id: i + 1,
      name,
      email,
      phone,
      city,
      state,
      pincode,
      joinedAt: new Date(now - joinedDaysAgo * 86400000).toISOString(),
    }
  })
}