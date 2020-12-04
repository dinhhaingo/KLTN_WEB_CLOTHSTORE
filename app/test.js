//libs
import React, { useContext, useState, useEffect } from 'react'
import { Form, Input, Select } from 'antd';
//others
import './style.scss'
import { layoutForm } from '@/constants/layout'
//context
import { DetailOrderContext } from '@/context/DetailOrderContext'
import { useRouter } from '@/hooks';
//json address
const tree = require('@/addressVN/tree')

const { Option } = Select;
const { TextArea } = Input

interface Props {
    record?: any,
}

const PaymentDetails: React.FC<Props> = () => {
    const param = useRouter().query.id 
    const [isDisable, setIsDisable] = useState(false)
    const { order, orderChange } = useContext(DetailOrderContext)
    const [form] = Form.useForm();
    const [district, setDistrict] = useState([])
    const [ward, setWard] = useState([])    

    const handleOnChange = async () => {
        let value = await form.getFieldsValue()
        let temp = { ...value }
        if (orderChange) {
            orderChange({ paymentDetail: temp })
        }
    }
    // FIX TO HERE

    const handleProvinceOnChange = async (value: any, key: any) =>{
        await setDistrict([])
        await setWard([])
        await form.setFieldsValue({district: undefined, ward:undefined})
        await setDistrict(tree[(key.key)][`quan-huyen`])
        let result = await form.getFieldsValue()
        let temp = { ...result, provinceCity: value, district: undefined, ward: undefined }
        if (orderChange) {
            orderChange({ paymentDetail: temp })
        }
    }

    const handleDistrictOnChange = async (value: any, key:any)=>{
        await setWard([])
        await form.setFieldsValue({ward:undefined})
        await setWard(district[(key.key)][`xa-phuong`])
        let result = await form.getFieldsValue()
        let temp = { ...result, district: value, ward: undefined }
        if (orderChange) {
            orderChange({ paymentDetail: temp })
        }
    }

    const handleWardOnChange = async (value: any, key: any)=>{
        let result = await form.getFieldsValue()
        let temp = { ...result, ward: value }
        if (orderChange) {
            orderChange({ paymentDetail: temp })
        }
    }
    useEffect(() => {
        if(!order.paymentDetail){
        }else{
            form.setFieldsValue(order.paymentDetail)
        }
        if(param){
            setIsDisable(true)
        }
    }, [form, order.paymentDetail, param])

    return (
        <Form name='payment' form={form} {...layoutForm} onChange={handleOnChange}>
            <Form.Item label='Payment Method' name='paymentMethod'>
                <Select onSelect={handleOnChange} placeholder='select payment method...' disabled={isDisable} >
                    <Option value='1'>
                        buy at the store
                    </Option>
                    <Option value='2'>
                        remote purchase
                    </Option>
                </Select>
            </Form.Item>
            <Form.Item label='Delivery Option' name='deliveryOption'>
                <Select onSelect={handleOnChange} placeholder='select delivery option...' disabled={isDisable}>
                    <Option value='1'>
                        Standard Delivery
                    </Option>
                    <Option value='2'>
                        Instant Delivery
                    </Option>
                </Select>
            </Form.Item>
            <Form.Item label='Province/City' name='provinceCity'>
                <Select onChange={handleProvinceOnChange} placeholder='select province/city...' disabled={isDisable} >
                    {Object.values(tree).map((item: any) => <Option key={item.code} value={item.name}>{item.name}</Option>)}
                </Select>
            </Form.Item>
            <Form.Item label='District' name='district'>
                <Select onChange={handleDistrictOnChange} placeholder='select district...' disabled={isDisable}>
                    {Object.values(district).map((item: any) => <Option key={item.code} value={item.name}>{item.name}</Option>)}
                </Select>
            </Form.Item>
            <Form.Item label='Ward' name='ward'>
                <Select onChange={handleWardOnChange}  placeholder='select ward...' disabled={isDisable}>
                    {Object.values(ward).map((item: any) => <Option key={item.code} value={item.name}>{item.name}</Option>)}
                </Select>
            </Form.Item>
            <Form.Item label='Address' name='address'>
                <TextArea rows={4} placeholder='input the address...' disabled={isDisable}/>
            </Form.Item>
        </Form>
    )
}

export default PaymentDetails