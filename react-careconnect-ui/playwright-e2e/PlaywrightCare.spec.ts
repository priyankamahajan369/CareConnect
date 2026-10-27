import {test,expect} from '@playwright/test';
test('staff can verify synthetic eligibility and see the result',async({page})=>{await page.goto('/#/insurance');await page.getByRole('combobox',{name:/Patient/}).click();await page.getByRole('option',{name:'Maya Bennett'}).click();await page.getByRole('button',{name:'Check simulated eligibility'}).click();await expect(page.getByText('A little more clarity.')).toBeVisible();await expect(page.getByRole('cell',{name:'NS1001'})).toBeVisible();});
test('mobile navigation remains usable',async({page})=>{await page.setViewportSize({width:390,height:844});await page.goto('/');await page.getByRole('button',{name:'Open menu'}).click();await page.getByRole('link',{name:'Patients',exact:true}).click();await expect(page.getByRole('heading',{name:'Your patients'})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);});

test('book, reject a duplicate slot, and cancel from the connected schedule',async({page})=>{
 await page.goto('/#/appointments');
 const fillBooking=async()=>{
  await page.getByRole('button',{name:'Book appointment',exact:true}).click();
  await page.getByRole('combobox',{name:/Patient/}).click();await page.getByRole('option',{name:'Maya Bennett'}).click();
  await page.getByRole('combobox',{name:/Provider/}).click();await page.getByRole('option',{name:/Dr. Elena Rivera/}).click();
  await page.getByLabel('Visit date').fill('2099-01-01');
  await page.getByRole('button',{name:'Confirm booking'}).click();
 };
 await fillBooking();await expect(page.getByText('Appointment booked. Notification queued.')).toBeVisible();
 await fillBooking();await expect(page.getByText('This provider or patient already has an appointment in this slot')).toBeVisible();
 await page.getByRole('button',{name:'Close booking'}).click();
 const row=page.getByRole('row').filter({hasText:'Maya Bennett'}).filter({hasText:'Jan 1'});
 await row.getByRole('button',{name:'Cancel appointment for Maya Bennett'}).click();await page.getByRole('button',{name:'Confirm change'}).click();await expect(row.getByText('cancelled',{exact:true})).toBeVisible();
});
test('patient detail loads its contact API',async({page})=>{await page.goto('/#/patients');await page.getByRole('button',{name:'Maya Bennett'}).click();await expect(page.getByText(/Mobile: 555/)).toBeVisible();});
