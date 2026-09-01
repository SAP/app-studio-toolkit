import {initComponent, destroy} from '../Utils'
import ImageDlg from '../../../src/components/ImageDlg.vue'
import _ from 'lodash'

let wrapper

describe('IImageDlg.vue', () => {

    afterEach(() => {
        destroy(wrapper)
    });

    test('component name', () => {
        wrapper = initComponent(ImageDlg, {image: ""}, true)
        //expect(wrapper.name()).toBe('ImageDlg')
    })

    test('component props', () => {
        wrapper = initComponent(ImageDlg, {image: ""}, true)
        expect(_.keys(wrapper.props())).toHaveLength(1)
    })
})